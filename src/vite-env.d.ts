/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Firebase web config (JSON or the console snippet) baked into the build. */
  readonly VITE_FIREBASE_CONFIG?: string;
}
