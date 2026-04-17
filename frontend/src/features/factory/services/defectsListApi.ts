import type { SupabaseResult } from '@/entities/factory/model/types';
import { getSupabaseClient, isSupabaseConfigured } from '@/shared/lib/supabase/client';
import type { InspectionReportRow } from '@/features/factory/services/inspectionReportsApi';

export type DefectListRow = InspectionReportRow & {
  task_title?: string | null;
  equipment_label?: string | null;
};

export async function fetchDefectReportsList(): Promise<SupabaseResult<DefectListRow[]>> {
  if (!isSupabaseConfigured()) {
    return { data: [], error: null };
  }
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('inspection_reports')
      .select('*')
      .eq('defect_found', true)
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      return { data: [], error: error.message };
    }

    const rows = (data ?? []) as InspectionReportRow[];
    const enriched: DefectListRow[] = [];

    for (const r of rows) {
      let task_title: string | null = null;
      let equipment_label: string | null = null;
      if (r.task_id) {
        const { data: t } = await supabase
          .from('inspection_tasks')
          .select('title')
          .eq('id', r.task_id)
          .maybeSingle();
        task_title = (t as { title?: string } | null)?.title ?? null;
      }
      if (r.equipment_id) {
        const { data: it } = await supabase
          .from('inspection_task_items')
          .select('equipment_name, equipment_code')
          .eq('id', r.equipment_id)
          .maybeSingle();
        const row = it as { equipment_name?: string; equipment_code?: string } | null;
        if (row) {
          equipment_label = [row.equipment_name, row.equipment_code].filter(Boolean).join(' · ') || null;
        }
      }
      enriched.push({ ...r, task_title, equipment_label });
    }

    return { data: enriched, error: null };
  } catch (e) {
    return { data: [], error: e instanceof Error ? e.message : String(e) };
  }
}
