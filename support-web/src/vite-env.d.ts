/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Support Django API origin. Defaults to http://localhost:8002 */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
