interface ImportMetaEnv {
  // The API base URL in development and tests (.env.development, .env.test); production reads /config.json.
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
