import { getSupabaseClient, isSupabaseConfigured } from '@/shared/lib/supabase/client';

export type AnalyticsOverview = {
  tasksTotal: number;
  tasksCompleted: number;
  reportsLast30d: number;
  defectsLast30d: number;
};

export type ReportsPerDayPoint = { label: string; count: number };

export async function fetchAnalyticsOverview(): Promise<{
  data: AnalyticsOverview | null;
  error: string | null;
}> {
  if (!isSupabaseConfigured()) {
    return { data: null, error: null };
  }
  const supabase = getSupabaseClient();
  const from30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  try {
    const [tAll, tDone, rep, def] = await Promise.all([
      supabase.from('inspection_tasks').select('id', { count: 'exact', head: true }),
      supabase
        .from('inspection_tasks')
        .select('id', { count: 'exact', head: true })
        .in('status', ['completed', 'completed_with_issues']),
      supabase
        .from('inspection_reports')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', from30),
      supabase
        .from('inspection_reports')
        .select('id', { count: 'exact', head: true })
        .eq('defect_found', true)
        .gte('created_at', from30),
    ]);

    const err = tAll.error || tDone.error || rep.error || def.error;
    if (err) {
      return { data: null, error: err.message };
    }

    return {
      data: {
        tasksTotal: tAll.count ?? 0,
        tasksCompleted: tDone.count ?? 0,
        reportsLast30d: rep.count ?? 0,
        defectsLast30d: def.count ?? 0,
      },
      error: null,
    };
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

/** Отчёты по дням за последние N дней (для графика на дашборде аналитики). */
export async function fetchReportsPerDayLastDays(days: number): Promise<ReportsPerDayPoint[]> {
  if (!isSupabaseConfigured() || days < 1) return [];
  const supabase = getSupabaseClient();
  const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('inspection_reports')
    .select('created_at')
    .gte('created_at', from)
    .limit(2000);

  if (error || !data) return [];

  const counts = new Map<string, number>();
  for (const row of data as { created_at: string }[]) {
    const day = new Date(row.created_at).toISOString().slice(0, 10);
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }

  const points: ReportsPerDayPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
    points.push({ label, count: counts.get(key) ?? 0 });
  }
  return points;
}
