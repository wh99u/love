import type { RemoteRec } from './merge';

export interface Member {
  name: string;
  photo?: string;
  /** last time this phone connected, ms */
  seen: number;
}

export interface SyncImage {
  type: string;
  b64: string;
}

export type LinkState = 'online' | 'offline' | 'error';

/** What the sync engine needs from a server; Firestore in the app, memory in tests. */
export interface Transport {
  /** Streams records of the space; `complete` is true once the server (not a cache) answered. */
  listen(onDocs: (docs: RemoteRec[], complete: boolean) => void, onState: (s: LinkState, error?: string) => void): () => void;
  /** Writes records; returns the ones the server accepted (older copies are refused). */
  write(docs: RemoteRec[]): Promise<RemoteRec[]>;
  putImage(id: string, img: SyncImage): Promise<void>;
  getImage(id: string): Promise<SyncImage | null>;
  /** Space members, live. */
  members(fn: (m: Record<string, Member>) => void): () => void;
  hello(deviceId: string, me: Member): Promise<void>;
  bye(deviceId: string): Promise<void>;
  close(): void;
}
