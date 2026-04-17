import type { InspectionTaskRow, SupabaseResult } from '@/entities/factory/model/types';
import { getSupabaseClient, isSupabaseConfigured } from '@/shared/lib/supabase/client';

/** Строка `inspection_reports` (мобильное приложение). */
export type InspectionReportRow = {
  id: string;
  task_id: string;
  equipment_id: string;
  checklist: unknown;
  measurements: unknown;
  comment_text?: string | null;
  defect_found?: boolean | null;
  defect_description?: string | null;
  defect_priority?: string | null;
  photo_count?: number | null;
  audio_count?: number | null;
  created_at?: string | null;
  [key: string]: unknown;
};

export type ReportListRow = InspectionReportRow & {
  task_title?: string | null;
  equipment_name?: string | null;
  equipment_code?: string | null;
};

async function fetchTaskTitle(taskId: string): Promise<string | null> {
  const supabase = getSupabaseClient();
  const { data } = await supabase
    .from('inspection_tasks')
    .select('title')
    .eq('id', taskId)
    .maybeSingle();
  return (data as { title?: string } | null)?.title ?? null;
}

/** Пункт задания: `equipment_id` в отчёте = `inspection_task_items.id`. */
async function fetchTaskItemLabel(itemId: string): Promise<{
  equipment_name: string | null;
  equipment_code: string | null;
}> {
  const supabase = getSupabaseClient();
  const { data } = await supabase
    .from('inspection_task_items')
    .select('*')
    .eq('id', itemId)
    .maybeSingle();
  const row = data as Record<string, unknown> | null;
  if (!row) return { equipment_name: null, equipment_code: null };
  const name = (row.equipment_name as string | undefined) ?? null;
  const code = (row.equipment_code as string | undefined) ?? null;
  return { equipment_name: name, equipment_code: code };
}

export async function fetchInspectionReportsList(): Promise<SupabaseResult<ReportListRow[]>> {
  if (!isSupabaseConfigured()) {
    return { data: [], error: null };
  }
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('inspection_reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(300);

    if (error) {
      return { data: [], error: error.message };
    }
    const rows = (data ?? []) as InspectionReportRow[];
    const enriched: ReportListRow[] = [];

    for (const r of rows) {
      let task_title: string | null = null;
      let equipment_name: string | null = null;
      let equipment_code: string | null = null;
      if (r.task_id) {
        try {
          task_title = await fetchTaskTitle(r.task_id);
        } catch {
          /* ignore */
        }
      }
      if (r.equipment_id) {
        try {
          const labels = await fetchTaskItemLabel(r.equipment_id);
          equipment_name = labels.equipment_name;
          equipment_code = labels.equipment_code;
        } catch {
          /* ignore */
        }
      }
      enriched.push({ ...r, task_title, equipment_name, equipment_code });
    }

    return { data: enriched, error: null };
  } catch (e) {
    console.error('[inspectionReportsApi.list]', e);
    return { data: [], error: e instanceof Error ? e.message : String(e) };
  }
}

export type ReportDetailBundle = {
  report: InspectionReportRow | null;
  task: InspectionTaskRow | null;
  equipment_name: string | null;
  equipment_location: string | null;
  equipment_code: string | null;
};

export async function fetchInspectionReportDetail(
  id: string,
): Promise<SupabaseResult<ReportDetailBundle>> {
  const empty: ReportDetailBundle = {
    report: null,
    task: null,
    equipment_name: null,
    equipment_location: null,
    equipment_code: null,
  };
  if (!id?.trim()) {
    return { data: empty, error: null };
  }
  if (!isSupabaseConfigured()) {
    return { data: empty, error: null };
  }
  try {
    const supabase = getSupabaseClient();
    const { data: reportRow, error: repErr } = await supabase
      .from('inspection_reports')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (repErr) {
      return { data: empty, error: repErr.message };
    }
    if (!reportRow) {
      return { data: empty, error: 'Отчёт не найден' };
    }

    const report = reportRow as InspectionReportRow;
    let task: InspectionTaskRow | null = null;
    if (report.task_id) {
      const { data: t } = await supabase
        .from('inspection_tasks')
        .select('*')
        .eq('id', report.task_id)
        .maybeSingle();
      if (t) task = t as InspectionTaskRow;
    }

    let equipment_name: string | null = null;
    let equipment_location: string | null = null;
    let equipment_code: string | null = null;
    if (report.equipment_id) {
      const { data: item } = await supabase
        .from('inspection_task_items')
        .select('*')
        .eq('id', report.equipment_id)
        .maybeSingle();
      const it = item as Record<string, unknown> | null;
      if (it) {
        equipment_name = (it.equipment_name as string | undefined) ?? null;
        equipment_location = (it.equipment_location as string | undefined) ?? null;
        equipment_code = (it.equipment_code as string | undefined) ?? null;
      }
    }

    return {
      data: {
        report,
        task,
        equipment_name,
        equipment_location,
        equipment_code,
      },
      error: null,
    };
  } catch (e) {
    console.error('[inspectionReportsApi.detail]', e);
    return {
      data: empty,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
