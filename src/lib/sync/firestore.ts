import type { FirebaseConfig } from './config';
import { keyOf, type RemoteRec } from './merge';
import type { Member, SyncImage, Transport } from './transport';

/* Firestore layout (see firestore.rules):
   spaces/{spaceId}            { members: { [deviceId]: Member } }
   spaces/{spaceId}/recs/{k~id} RemoteRec
   spaces/{spaceId}/imgs/{id}   SyncImage
   The SDK is loaded only when sync is switched on. */

type Fs = typeof import('firebase/firestore');
type Db = import('firebase/firestore').Firestore;

const dbs = new Map<string, Promise<{ fs: Fs; db: Db }>>();

function open(cfg: FirebaseConfig) {
  let p = dbs.get(cfg.projectId);
  if (!p) {
    p = (async () => {
      const [{ initializeApp, getApps }, fs] = await Promise.all([import('firebase/app'), import('firebase/firestore')]);
      const app = getApps().find((a) => a.name === cfg.projectId) ?? initializeApp(cfg, cfg.projectId);
      // Long polling where streaming is cut by proxies or in-app browsers.
      const db = fs.initializeFirestore(app, { ignoreUndefinedProperties: true, experimentalAutoDetectLongPolling: true });
      return { fs, db };
    })();
    p.catch(() => dbs.delete(cfg.projectId));
    dbs.set(cfg.projectId, p);
  }
  return p;
}

const code = (e: unknown) => String((e as { code?: string })?.code ?? e);

/** Who is in the space, or null when there is no such space. */
export async function peekSpace(cfg: FirebaseConfig, spaceId: string): Promise<Record<string, Member> | null> {
  const { fs, db } = await open(cfg);
  const snap = await fs.getDoc(fs.doc(db, 'spaces', spaceId));
  return snap.exists() ? ((snap.data().members ?? {}) as Record<string, Member>) : null;
}

export async function firestoreTransport(cfg: FirebaseConfig, spaceId: string): Promise<Transport> {
  const { fs, db } = await open(cfg);
  const space = fs.doc(db, 'spaces', spaceId);
  const recs = fs.collection(space, 'recs');
  const imgs = fs.collection(space, 'imgs');
  const offs = new Set<() => void>();
  const track = (off: () => void) => {
    offs.add(off);
    return () => {
      off();
      offs.delete(off);
    };
  };

  return {
    listen(onDocs, onState) {
      return track(
        fs.onSnapshot(
          recs,
          { includeMetadataChanges: true },
          (snap) => {
            const docs = snap
              .docChanges()
              // our own unconfirmed writes are not the server's word yet
              .filter((c) => c.type !== 'removed' && !c.doc.metadata.hasPendingWrites)
              .map((c) => c.doc.data() as RemoteRec);
            const complete = !snap.metadata.fromCache;
            if (docs.length || complete) onDocs(docs, complete);
            onState(complete ? 'online' : 'offline');
          },
          (e) => onState('error', code(e)),
        ),
      );
    },

    async write(docs) {
      const ref = (d: RemoteRec) => fs.doc(recs, keyOf(d.k, d.id));
      try {
        const batch = fs.writeBatch(db);
        for (const d of docs) batch.set(ref(d), d);
        await batch.commit();
        return docs;
      } catch (e) {
        if (code(e) !== 'permission-denied') throw e;
        // One older copy refuses the whole batch: write one by one and skip the refused.
        const ok: RemoteRec[] = [];
        for (const d of docs) {
          try {
            await fs.setDoc(ref(d), d);
            ok.push(d);
          } catch (e2) {
            if (code(e2) !== 'permission-denied') throw e2;
          }
        }
        return ok;
      }
    },

    async putImage(id, img) {
      await fs.setDoc(fs.doc(imgs, id), img);
    },

    async getImage(id) {
      const snap = await fs.getDoc(fs.doc(imgs, id));
      return snap.exists() ? (snap.data() as SyncImage) : null;
    },

    members(fn) {
      return track(fs.onSnapshot(space, (snap) => fn(((snap.exists() && snap.data().members) || {}) as Record<string, Member>), () => {}));
    },

    async hello(deviceId, me) {
      await fs.setDoc(space, { members: { [deviceId]: me } }, { merge: true });
    },

    async bye(deviceId) {
      await fs.updateDoc(space, { [`members.${deviceId}`]: fs.deleteField() });
    },

    close() {
      offs.forEach((off) => off());
      offs.clear();
    },
  };
}
