import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

function supabaseUrl(): string | undefined {
  return import.meta.env.VITE_SUPABASE_URL?.trim() || undefined;
}

function supabaseKey(): string | undefined {
  return (
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ||
    undefined
  );
}

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl() && supabaseKey());
}

export function getSupabaseClient(): SupabaseClient {
  const url = supabaseUrl();
  const key = supabaseKey();
  if (!url || !key) {
    throw new Error(
      'Задайте VITE_SUPABASE_URL и VITE_SUPABASE_PUBLISHABLE_KEY (или VITE_SUPABASE_ANON_KEY) в .env',
    );
  }
  if (!client) {
    client = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return client;
}
