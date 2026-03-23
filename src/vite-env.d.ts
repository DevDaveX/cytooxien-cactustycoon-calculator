/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DISCORD_GUILD_ID: string;
  readonly VITE_DISCORD_ADMIN_ROLE: string;
  readonly VITE_DISCORD_REDIRECT_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}