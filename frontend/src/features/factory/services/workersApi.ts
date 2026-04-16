import type { ProfileRow, SupabaseResult } from '@/entities/factory/model/types';
import { getSupabaseClient, isSupabaseConfigured } from '@/shared/lib/supabase/client';

export async function fetchWorkers(): Promise<SupabaseResult<ProfileRow[]>> {
  if (!isSupabaseConfigured()) {
    return { data: [], error: null };
  }
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'worker');

    if (error) {
      return { data: [], error: error.message };
    }
    return { data: (data ?? []) as ProfileRow[], error: null };
  } catch (e) {
    console.error('[workersApi]', e);
    return { data: [], error: e instanceof Error ? e.message : String(e) };
  }
}
