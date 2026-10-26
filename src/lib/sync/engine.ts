import { visible } from '../records';
import type { StateV4 } from '../types';
import { applyRemote, confirm, pending, type BaseMap, type RemoteRec } from './merge';
import type { LinkState, SyncImage, Transport } from './transport';

/** Sync bookkeeping kept on the phone next to the state. */
export interface SyncMeta {
  base: BaseMap;
  /** pictures already uploaded */
  imgs: string[];
}

export interface ImageStore {
  get(id: string): Promise<SyncImage | null>;
  put(id: string, img: SyncImage): Promise<void>;
}

/** The part of the app store the engine uses. */
export interface SyncedStore {
  get(): StateV4;
  subscribe(fn: () => void): () => void;
  actions: { replaceShared(next: StateV4['shared']): void };
}

export type EngineStatus = 'connecting' | LinkState;

interface EngineOptions {
  store: SyncedStore;
  transport: Transport;
  meta: SyncMeta;
  saveMeta: (m: SyncMeta) => void;
  images?: ImageStore;
  onStatus?: (s: EngineStatus, error?: string) => void;
  /** debounce of uploads after a local change, ms */
  delay?: number;
}

const CHUNK = 400; // Firestore allows 500 writes per batch
const RETRY = 4000;
const MAX_IMAGE_B64 = 950_000; // a document holds 1 MiB

/** Pictures the shared records point at. */
const imageIds = (s: StateV4['shared']) => {
  const ids = [...visible(s.buys), ...visible(s.banks)].flatMap((b) => (b.imgId ? [b.imgId] : []));
  if (s.car.imgId) ids.push(s.car.imgId);
  return ids;
};

/**
 * Keeps the shared half of one phone's state in step with the server: merges what
 * arrives, uploads what changed here. Uploads start only after the server answered
 * once, so an old copy on this phone never overwrites newer data there.
 */
export function createSyncEngine(o: EngineOptions) {
  const { store, transport } = o;
  let meta = o.meta;
  let ready = false;
  let busy = false;
  let again = false;
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const fetching = new Set<string>();
  const missing = new Set<string>();

  const save = () => o.saveMeta(meta);

  function schedule(ms = o.delay ?? 600) {
    if (stopped) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => void push(), ms);
  }

  async function push() {
    timer = null;
    if (!ready || stopped) return;
    if (busy) {
      again = true;
      return;
    }
    busy = true;
    try {
      await uploadImages(); // pictures first: a record must never arrive before its picture
      const todo = pending(store.get().shared, meta.base);
      for (let i = 0; i < todo.length; i += CHUNK) {
        const accepted = await transport.write(todo.slice(i, i + CHUNK));
        meta = { ...meta, base: confirm(meta.base, accepted) };
        save();
      }
    } catch (e) {
      o.onStatus?.('error', String((e as { code?: string })?.code ?? e));
      schedule(RETRY);
    } finally {
      busy = false;
      if (again) {
        again = false;
        schedule(0);
      }
    }
  }

  async function uploadImages() {
    if (!o.images) return;
    for (const id of imageIds(store.get().shared)) {
      if (meta.imgs.includes(id) || missing.has(id)) continue;
      const img = await o.images.get(id);
      if (!img) {
        missing.add(id); // the picture is on the other phone, or was never saved
        continue;
      }
      if (img.b64.length <= MAX_IMAGE_B64) await transport.putImage(id, img);
      meta = { ...meta, imgs: [...meta.imgs, id] };
      save();
    }
  }

  const tries = new Map<string, number>();

  async function fetchImages(shared: StateV4['shared']) {
    if (!o.images) return;
    for (const id of imageIds(shared)) {
      if (fetching.has(id) || meta.imgs.includes(id)) continue;
      fetching.add(id);
      let found = false;
      try {
        if (await o.images.get(id)) continue;
        const img = await transport.getImage(id);
        if (img) {
          found = true;
          await o.images.put(id, img);
          missing.delete(id);
          meta = { ...meta, imgs: [...meta.imgs, id] };
          save();
        }
      } catch {
        /* retried below */
      }
      if (!found) {
        fetching.delete(id);
        const n = (tries.get(id) ?? 0) + 1;
        tries.set(id, n);
        if (n <= 3 && !stopped) setTimeout(() => void fetchImages(store.get().shared), RETRY * n);
      }
    }
  }

  function onDocs(docs: RemoteRec[], complete: boolean) {
    if (stopped) return;
    const r = applyRemote(store.get().shared, meta.base, docs);
    meta = { ...meta, base: r.base };
    save();
    if (r.changed) store.actions.replaceShared(r.shared);
    if (complete) ready = true;
    void fetchImages(store.get().shared);
    schedule(0);
  }

  const unlisten = transport.listen(onDocs, (s, err) => o.onStatus?.(s, err));
  const unsubscribe = store.subscribe(() => schedule());
  o.onStatus?.('connecting');

  return {
    /** Uploads right away, e.g. before the app goes to the background. */
    flush: () => schedule(0),
    stop() {
      stopped = true;
      if (timer) clearTimeout(timer);
      unlisten();
      unsubscribe();
    },
  };
}

export type SyncEngine = ReturnType<typeof createSyncEngine>;
