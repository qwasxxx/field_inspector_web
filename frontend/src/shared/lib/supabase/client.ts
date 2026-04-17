import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

/** Vite внедряет только переменные с префиксом VITE_. Файл: frontend/.env.local (см. frontend/.env.example). */
function supabaseUrl(): string | undefined {
  return (
    import.meta.env.VITE_SUPABASE_URL?.trim() ||
    import.meta.env.VITE_PUBLIC_SUPABASE_URL?.trim() ||
    undefined
  );
}

function supabaseKey(): string | undefined {
  return (
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ||
    import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    undefined
  );
}

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl() && supabaseKey());
}

/**
 * Точное объяснение, почему чат/Supabase недоступны (для UI).
 * Не раскрывает секреты.
 */
export function describeSupabaseConfigGap(): string | null {
  if (isSupabaseConfigured()) return null;
  const hasUrl = Boolean(supabaseUrl());
  const hasKey = Boolean(supabaseKey());
  const parts: string[] = [
    'Web paneli mobil uygulama ile aynı Supabase projesine bağlanmalı.',
    'frontend/.env.local eksik veya yanlış olabilir (Vite yalnızca frontend/.env.local veya frontend/.env okur; repo kökündeki .env otomatik yüklenmez).',
  ];
  if (!hasUrl) {
    parts.push(
      'Eksik URL: VITE_SUPABASE_URL (veya VITE_PUBLIC_SUPABASE_URL) — Supabase → Settings → API → Project URL.',
    );
  }
  if (!hasKey) {
    parts.push(
      'Eksik anahtar: VITE_SUPABASE_PUBLISHABLE_KEY veya VITE_SUPABASE_ANON_KEY — aynı API sayfasındaki anon/publishable key.',
    );
  }
  parts.push('.env.local değişikliğinden sonra npm run dev ile yeniden başlatın.');
  return parts.join(' ');
}

export function getSupabaseClient(): SupabaseClient {
  const url = supabaseUrl();
  const key = supabaseKey();
  if (!url || !key) {
    throw new Error(describeSupabaseConfigGap() ?? 'Supabase Vite ortam değişkenlerini ayarlayın.');
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
