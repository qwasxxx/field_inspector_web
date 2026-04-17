import type { SupabaseResult } from '@/entities/factory/model/types';
import { API_BASE } from '@/shared/api/client';
import { fetchWithSupabaseAccessToken } from '@/shared/api/supabaseSessionFetch';

export type CreateWorkerAccountPayload = {
  full_name: string;
  username: string;
  employee_code: string;
  email: string;
  password: string;
  is_active: boolean;
};

function mapNetworkError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  const low = msg.toLowerCase();
  if (
    low.includes('failed to fetch') ||
    low.includes('networkerror') ||
    low.includes('network request failed') ||
    low.includes('load failed') ||
    (e instanceof TypeError && low.includes('fetch'))
  ) {
    return (
      'Сервер API недоступен. Запустите бэкенд из каталога backend: ' +
      './run_dev.sh (или: .venv/bin/python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000). ' +
      'В режиме разработки запросы проксируются с :5173 на :8000 (см. vite.config.ts).'
    );
  }
  if (msg === 'Нет сессии Supabase') {
    return 'Войдите в панель под учётной записью администратора Supabase и повторите.';
  }
  if (msg === 'Supabase не настроен') {
    return 'Задайте VITE_SUPABASE_URL и VITE_SUPABASE_PUBLISHABLE_KEY в frontend/.env.local.';
  }
  return msg;
}

export async function createWorkerAccount(
  payload: CreateWorkerAccountPayload,
): Promise<SupabaseResult<{ id: string | null }>> {
  try {
    const r = await fetchWithSupabaseAccessToken('/api/v1/admin/supabase/workers', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const text = await r.text();
    if (!r.ok) {
      let msg = text || `HTTP ${r.status}`;
      try {
        const j = JSON.parse(text) as { error?: string; detail?: unknown };
        if (typeof j.error === 'string') {
          msg = j.error;
        } else if (Array.isArray(j.detail)) {
          const parts = j.detail
            .map((d) =>
              d && typeof d === 'object' && 'msg' in d
                ? String((d as { msg: string }).msg)
                : JSON.stringify(d),
            )
            .filter(Boolean);
          if (parts.length) msg = parts.join('; ');
        }
      } catch {
        /* сырой текст */
      }
      if (r.status === 401) {
        msg = `Нет доступа (401). ${msg}`;
      } else if (r.status === 403) {
        msg = `Доступ запрещён (403). Нужна роль admin в profiles. ${msg}`;
      } else if (r.status === 503) {
        msg = `Сервер не настроен (503). Проверьте SUPABASE_* в backend/.env. ${msg}`;
      }
      if (import.meta.env.DEV) {
        console.error('[workersAdminApi.create]', r.status, msg);
      }
      return { data: { id: null }, error: msg };
    }
    let data: { id: string };
    try {
      data = JSON.parse(text) as { id: string };
    } catch {
      return { data: { id: null }, error: 'Пустой или некорректный ответ сервера при создании.' };
    }
    if (!data?.id) {
      return { data: { id: null }, error: 'Сервер не вернул id созданного пользователя.' };
    }
    if (import.meta.env.DEV) {
      console.info('[workersAdminApi.create] ok', data.id);
    }
    return { data: { id: data.id }, error: null };
  } catch (e) {
    if (import.meta.env.DEV) {
      console.error('[workersAdminApi.create] exception', e);
    }
    return {
      data: { id: null },
      error: mapNetworkError(e),
    };
  }
}

/** Диагностика dev: проверка прокси/доступности бэкенда (не для production UI). */
export async function probeBackendHealth(): Promise<boolean> {
  try {
    const base = API_BASE || '';
    const url = base ? `${base.replace(/\/$/, '')}/health` : '/health';
    const r = await fetch(url, { method: 'GET' });
    return r.ok;
  } catch {
    return false;
  }
}
