/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_PUBLIC_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_PUBLIC_SUPABASE_ANON_KEY?: string;
  /** task_chat_messages text column (default: body). Must match mobile + DB. */
  readonly VITE_TASK_CHAT_MESSAGE_COLUMN?: string;
  /** Supabase Storage bucket for task chat media (default: task-chat-media). */
  readonly VITE_TASK_CHAT_MEDIA_BUCKET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.module.scss' {
  const classes: Readonly<Record<string, string>>;
  export default classes;
}
