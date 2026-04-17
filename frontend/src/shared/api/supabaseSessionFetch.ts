import { apiUrl } from '@/shared/api/client';
import { getSupabaseClient, isSupabaseConfigured } from '@/shared/lib/supabase/client';

/**
 * Вызов FastAPI с тем же Bearer, что и у Supabase (access_token), а не fi_access_token FastAPI.
 */
export async function fetchWithSupabaseAccessToken(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  // Пустой VITE_API_BASE_URL в dev: относительные URL → Vite proxy на FastAPI (см. vite.config.ts).
  if (!isSupabaseConfigured()) {
    throw new Error('Подключение к данным не настроено');
  }
  const supabase = getSupabaseClient();
  const {
    data: { session },
    error: sessionErr,
  } = await supabase.auth.getSession();
  if (sessionErr) {
    throw sessionErr;
  }
  const token = session?.access_token;
  if (!token) {
    throw new Error('Нет активной сессии');
  }
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);
  if (
    init.body !== undefined &&
    typeof init.body === 'string' &&
    !headers.has('Content-Type')
  ) {
    headers.set('Content-Type', 'application/json');
  }
  return fetch(apiUrl(path), { ...init, headers });
}
