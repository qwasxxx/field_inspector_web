import type { ProfileRow, SupabaseResult } from '@/entities/factory/model/types';
import { getSupabaseClient, isSupabaseConfigured } from '@/shared/lib/supabase/client';

export type FetchWorkersOptions = {
  /** По умолчанию true — только активные (назначение на задание). false — все обходчики для списка в админке. */
  onlyActive?: boolean;
};

export async function fetchWorkers(
  options?: FetchWorkersOptions,
): Promise<SupabaseResult<ProfileRow[]>> {
  const onlyActive = options?.onlyActive !== false;

  if (!isSupabaseConfigured()) {
    return { data: [], error: null };
  }
  try {
    const supabase = getSupabaseClient();
    let q = supabase.from('profiles').select('*').eq('role', 'worker');
    if (onlyActive) {
      q = q.eq('is_active', true);
    }
    const { data, error } = await q;

    if (error) {
      console.error('[workersApi] profiles', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      const rls =
        error.code === '42501' ||
        /permission denied|row-level security/i.test(error.message);
      const rlsRu = rls
        ? 'Отклонено политикой RLS или недостаточно прав при чтении profiles. '
        : '';
      return {
        data: [],
        error: `${rlsRu}${[error.message, error.details, error.hint].filter(Boolean).join(' · ')}`,
      };
    }
    return { data: (data ?? []) as ProfileRow[], error: null };
  } catch (e) {
    console.error('[workersApi]', e);
    return { data: [], error: e instanceof Error ? e.message : String(e) };
  }
}
