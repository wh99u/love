import { uid } from './ids';

const DB = 'planner-images';
const STORE = 'images';

interface Stored {
  type: string;
  buf: ArrayBuffer;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function db(): Promise<IDBDatabase> {
  dbPromise ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => {
      dbPromise = null;
      reject(req.error);
    };
  });
  return dbPromise;
}

async function run<T>(mode: IDBTransactionMode, op: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const d = await db();
  return new Promise((resolve, reject) => {
    const req = op(d.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function imagesAvailable() {
  try {
    await db();
    return true;
  } catch {
    return false;
  }
}

const listeners = new Set<(id: string) => void>();

/** Fires when a picture arrives later, e.g. from the partner's phone. */
export function onImage(fn: (id: string) => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Stored as bytes + type: Blobs inside IndexedDB were flaky on older iOS. */
export async function putImage(blob: Blob): Promise<string> {
  const id = uid();
  await putImageBytes(id, blob.type, await blob.arrayBuffer());
  return id;
}

/** Saves a picture under a known id (synced pictures keep the id of their record). */
export async function putImageBytes(id: string, type: string, buf: ArrayBuffer): Promise<void> {
  const value: Stored = { type, buf };
  await run('readwrite', (s) => s.put(value, id));
  listeners.forEach((fn) => fn(id));
}

export async function getImageBytes(id: string): Promise<Stored | null> {
  return ((await run('readonly', (s) => s.get(id))) as Stored | undefined) ?? null;
}

export async function getImageBlob(id: string): Promise<Blob | null> {
  const v = await getImageBytes(id);
  return v ? new Blob([v.buf], { type: v.type }) : null;
}

const urls = new Map<string, string>();

export async function getImageUrl(id: string): Promise<string | null> {
  const cached = urls.get(id);
  if (cached) return cached;
  const blob = await getImageBlob(id);
  if (!blob) return null;
  const url = URL.createObjectURL(blob);
  urls.set(id, url);
  return url;
}

export async function deleteImage(id: string): Promise<void> {
  const url = urls.get(id);
  if (url) URL.revokeObjectURL(url);
  urls.delete(id);
  await run('readwrite', (s) => s.delete(id));
}
