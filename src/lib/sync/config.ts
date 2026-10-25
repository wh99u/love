/** Firebase web config. Not a secret: access is limited by firestore.rules. */
export interface FirebaseConfig {
  apiKey: string;
  projectId: string;
  authDomain?: string;
  appId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
}

/**
 * Paste the `firebaseConfig = { … }` snippet from the Firebase console here (or set the
 * VITE_FIREBASE_CONFIG variable for the build) — then both phones connect without setup.
 */
const BUILT_IN = '';

const KEYS = ['apiKey', 'projectId', 'authDomain', 'appId', 'storageBucket', 'messagingSenderId'] as const;
const LOCAL_KEY = 'planner_firebase';

/** Accepts JSON or the JavaScript object exactly as the Firebase console shows it. */
export function parseConfig(text: string | null | undefined): FirebaseConfig | null {
  if (!text) return null;
  const pick = (k: string) => new RegExp(`["']?${k}["']?\\s*:\\s*["'\`]([^"'\`]+)["'\`]`).exec(text)?.[1]?.trim();
  const out: Record<string, string> = {};
  for (const k of KEYS) {
    const v = pick(k);
    if (v) out[k] = v;
  }
  return out.apiKey && out.projectId ? (out as unknown as FirebaseConfig) : null;
}

const read = (storage: Storage) => {
  try {
    return storage.getItem(LOCAL_KEY);
  } catch {
    return null;
  }
};

export function firebaseConfig(storage: Storage = localStorage): FirebaseConfig | null {
  return parseConfig(import.meta.env.VITE_FIREBASE_CONFIG) ?? parseConfig(BUILT_IN) ?? parseConfig(read(storage));
}

export const builtInConfig = () => !!(parseConfig(import.meta.env.VITE_FIREBASE_CONFIG) ?? parseConfig(BUILT_IN));

export function saveConfig(text: string, storage: Storage = localStorage): FirebaseConfig | null {
  const cfg = parseConfig(text);
  if (cfg) storage.setItem(LOCAL_KEY, JSON.stringify(cfg));
  return cfg;
}
