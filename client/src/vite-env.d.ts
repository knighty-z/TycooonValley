/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SERVER_URL?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_BACKEND_MODE?: 'supabase' | 'socket';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
