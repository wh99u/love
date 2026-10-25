import { appStore, isDemo } from '../appStore';
import { defaultCar } from '../defaults';
import { getImageBytes, putImageBytes } from '../images';
import { startAppUrl } from '../shortcut';
import { getUser } from '../telegram';
import type { StateV4 } from '../types';
import { firebaseConfig, saveConfig as storeConfig } from './config';
import { createSyncEngine, type EngineStatus, type ImageStore, type SyncEngine, type SyncMeta } from './engine';
import { firestoreTransport, peekSpace } from './firestore';
import { randomId, SPACE_ID_LEN } from './ids';
import type { Member, Transport } from './transport';

/* The app's one connection to the shared plan. UI reads it through useSync(). */

export interface SyncState {
  configured: boolean;
  spaceId: string | null;
  status: 'off' | EngineStatus;
  error?: string;
  members: Record<string, Member>;
  deviceId: string;
}

interface Saved {
  spaceId: string | null;
  deviceId: string;
  meta: SyncMeta;
}

const KEY = isDemo ? 'planner_demo_sync' : 'planner_sync';
const emptyMeta = (): SyncMeta => ({ base: {}, imgs: [] });

function load(): Saved {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Saved | null;
    if (raw?.deviceId) return { spaceId: raw.spaceId ?? null, deviceId: raw.deviceId, meta: raw.meta ?? emptyMeta() };
  } catch {
    /* fresh start */
  }
  return { spaceId: null, deviceId: randomId(12), meta: emptyMeta() };
}

let saved = load();
let saveTimer: ReturnType<typeof setTimeout> | null = null;
function persist(now = false) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = null;
  const write = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(saved));
    } catch {
      /* the next save retries */
    }
  };
  if (now) write();
  else saveTimer = setTimeout(write, 300);
}
persist(true);

let state: SyncState = {
  configured: !!firebaseConfig(),
  spaceId: saved.spaceId,
  status: 'off',
  members: {},
  deviceId: saved.deviceId,
};
const listeners = new Set<() => void>();
const set = (patch: Partial<SyncState>) => {
  state = { ...state, ...patch };
  listeners.forEach((fn) => fn());
};

const toB64 = (buf: ArrayBuffer) => {
  const bytes = new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
};
const fromB64 = (b64: string) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)).buffer;

const images: ImageStore = {
  async get(id) {
    const v = await getImageBytes(id).catch(() => null);
    return v ? { type: v.type, b64: toB64(v.buf) } : null;
  },
  async put(id, img) {
    await putImageBytes(id, img.type, fromB64(img.b64));
  },
};

let engine: SyncEngine | null = null;
let transport: Transport | null = null;
let offMembers: (() => void) | null = null;
let generation = 0;

const me = (): Member => {
  const u = getUser();
  return { name: u.firstName, ...(u.photoUrl ? { photo: u.photoUrl } : {}), seen: Date.now() };
};

function disconnect() {
  generation++;
  engine?.stop();
  offMembers?.();
  transport?.close();
  engine = null;
  transport = null;
  offMembers = null;
}

async function connect(spaceId: string) {
  disconnect();
  const cfg = firebaseConfig();
  if (!cfg) return;
  const gen = generation;
  set({ status: 'connecting', error: undefined, spaceId });
  try {
    const t = await firestoreTransport(cfg, spaceId);
    if (gen !== generation) return t.close();
    transport = t;
    // offline the write waits in the SDK's queue; syncing must not wait for it
    void t.hello(saved.deviceId, me()).catch(() => {});
    offMembers = t.members((members) => set({ members }));
    engine = createSyncEngine({
      store: appStore,
      transport: t,
      meta: saved.meta,
      saveMeta: (m) => {
        saved = { ...saved, meta: m };
        persist();
      },
      images,
      onStatus: (status, error) => set({ status, error }),
    });
  } catch (e) {
    if (gen === generation) set({ status: 'error', error: String((e as { code?: string })?.code ?? e) });
  }
}

/** Shared half with nothing in it; the car is older than anything on the server. */
const emptyShared = (): StateV4['shared'] => ({ banks: [], incomes: [], car: { ...defaultCar(0), updatedAt: 0 }, buys: [], buyLists: [], budgets: [], spends: [] });

export const sync = {
  get: () => state,
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },

  /** On app start: reconnect to the saved space. */
  start() {
    if (isDemo || !saved.spaceId || !firebaseConfig()) return;
    void connect(saved.spaceId);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        engine?.flush();
        persist(true);
      }
    });
  },

  saveConfig(text: string) {
    const ok = !!storeConfig(text);
    if (ok) set({ configured: true });
    return ok;
  },

  /** Starts a new shared plan from this phone's data. */
  async create() {
    const spaceId = randomId(SPACE_ID_LEN);
    saved = { ...saved, spaceId, meta: emptyMeta() };
    persist(true);
    await connect(spaceId);
    return spaceId;
  },

  /** Who is in a space; null when the code is wrong. */
  async peek(spaceId: string) {
    const cfg = firebaseConfig();
    if (!cfg) throw new Error('not-configured');
    return peekSpace(cfg, spaceId);
  },

  /**
   * Joins a partner's plan. `merge` keeps this phone's cards and purchases and adds them
   * to the shared plan; `theirs` puts them aside and takes only what is already shared.
   */
  async join(spaceId: string, mode: 'merge' | 'theirs') {
    if (mode === 'theirs') {
      const shared = appStore.get().shared;
      try {
        localStorage.setItem(`${isDemo ? 'planner_demo' : 'planner_v4'}_before_join`, JSON.stringify(shared));
      } catch {
        /* backup is best effort */
      }
      appStore.actions.replaceShared(emptyShared());
    }
    saved = { ...saved, spaceId, meta: emptyMeta() };
    persist(true);
    await connect(spaceId);
  },

  /** Stops sharing; this phone keeps its copy of everything. */
  leave() {
    const t = transport;
    if (t) void t.bye(saved.deviceId).catch(() => {});
    disconnect();
    saved = { ...saved, spaceId: null, meta: emptyMeta() };
    persist(true);
    set({ spaceId: null, status: 'off', members: {}, error: undefined });
  },

  inviteLink(botLink: string) {
    return state.spaceId ? startAppUrl(botLink, `join_${state.spaceId}`) : '';
  },
};
