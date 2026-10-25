import { keyOf, type RemoteRec } from './merge';
import type { Member, SyncImage, Transport } from './transport';

/** In-memory server with the same rules as firestore.rules; for tests. */
export function createMemoryServer() {
  const recs = new Map<string, RemoteRec>();
  const imgs = new Map<string, SyncImage>();
  const members: Record<string, Member> = {};
  const feeds = new Set<(docs: RemoteRec[]) => void>();
  const memberFeeds = new Set<(m: Record<string, Member>) => void>();
  let online = true;

  const transport = (): Transport => {
    let feed: ((docs: RemoteRec[]) => void) | null = null;
    return {
      listen(onDocs) {
        feed = (docs) => onDocs(docs, true);
        feeds.add(feed);
        queueMicrotask(() => online && feed?.([...recs.values()]));
        return () => {
          if (feed) feeds.delete(feed);
        };
      },
      async write(docs) {
        if (!online) throw Object.assign(new Error('offline'), { code: 'unavailable' });
        const ok = docs.filter((d) => {
          const cur = recs.get(keyOf(d.k, d.id));
          return !cur || d.u >= cur.u;
        });
        for (const d of ok) recs.set(keyOf(d.k, d.id), structuredClone(d));
        const copy = structuredClone(ok);
        if (copy.length) queueMicrotask(() => feeds.forEach((f) => f(copy)));
        return ok;
      },
      async putImage(id, img) {
        imgs.set(id, img);
      },
      async getImage(id) {
        return imgs.get(id) ?? null;
      },
      members(fn) {
        memberFeeds.add(fn);
        fn({ ...members });
        return () => memberFeeds.delete(fn);
      },
      async hello(id, me) {
        members[id] = me;
        memberFeeds.forEach((f) => f({ ...members }));
      },
      async bye(id) {
        delete members[id];
        memberFeeds.forEach((f) => f({ ...members }));
      },
      close() {
        if (feed) feeds.delete(feed);
      },
    };
  };

  return {
    transport,
    recs,
    imgs,
    setOnline(v: boolean) {
      online = v;
      if (v) feeds.forEach((f) => f([...recs.values()]));
    },
  };
}
