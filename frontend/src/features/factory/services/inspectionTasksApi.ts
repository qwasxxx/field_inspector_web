import type {
  InspectionTaskAssignmentRow,
  InspectionTaskItemRow,
  InspectionTaskRow,
  ProfileRow,
  SupabaseResult,
} from '@/entities/factory/model/types';
import { getSupabaseClient, isSupabaseConfigured } from '@/shared/lib/supabase/client';

export type TaskWithExtras = InspectionTaskRow & {
  items_count?: number | null;
  assigned_worker?: ProfileRow | null;
};

export async function fetchInspectionTasks(): Promise<SupabaseResult<TaskWithExtras[]>> {
  if (!isSupabaseConfigured()) {
    return { data: [], error: null };
  }
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('inspection_tasks').select('*').limit(500);

    if (error) {
      return { data: [], error: error.message };
    }
    const rows = (data ?? []) as InspectionTaskRow[];
    const enriched: TaskWithExtras[] = [];

    for (const r of rows) {
      let items_count: number | null | undefined;
      let assigned_worker: ProfileRow | null | undefined;
      if (!r.id) {
        enriched.push({ ...r });
        continue;
      }
      try {
        const { count } = await supabase
          .from('inspection_task_items')
          .select('*', { count: 'exact', head: true })
          .eq('inspection_task_id', r.id);
        if (typeof count === 'number') items_count = count;
      } catch {
        /* таблица может отсутствовать */
      }
      try {
        const { data: assignment } = await supabase
          .from('inspection_task_assignments')
          .select('worker_id, profile_id')
          .eq('inspection_task_id', r.id)
          .maybeSingle();
        const a = assignment as InspectionTaskAssignmentRow | null;
        const pid = a?.worker_id ?? a?.profile_id;
        if (pid) {
          const { data: prof } = await supabase.from('profiles').select('*').eq('id', pid).maybeSingle();
          if (prof) assigned_worker = prof as ProfileRow;
        }
      } catch {
        /* join может отсутствовать */
      }
      enriched.push({ ...r, items_count, assigned_worker });
    }

    return { data: enriched, error: null };
  } catch (e) {
    console.error('[inspectionTasksApi.list]', e);
    return { data: [], error: e instanceof Error ? e.message : String(e) };
  }
}

export type TaskDetailBundle = {
  task: InspectionTaskRow | null;
  items: InspectionTaskItemRow[];
  assignment: InspectionTaskAssignmentRow | null;
  worker: ProfileRow | null;
};

export async function fetchTaskDetail(id: string): Promise<SupabaseResult<TaskDetailBundle>> {
  const empty: TaskDetailBundle = {
    task: null,
    items: [],
    assignment: null,
    worker: null,
  };
  if (!id?.trim()) {
    return { data: empty, error: null };
  }
  if (!isSupabaseConfigured()) {
    return { data: empty, error: null };
  }
  try {
    const supabase = getSupabaseClient();
    const { data: taskRow, error: taskErr } = await supabase
      .from('inspection_tasks')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (taskErr) {
      return { data: empty, error: taskErr.message };
    }
    if (!taskRow) {
      return { data: empty, error: 'Задание не найдено' };
    }

    const { data: items } = await supabase
      .from('inspection_task_items')
      .select('*')
      .eq('inspection_task_id', id);

    const { data: assignment } = await supabase
      .from('inspection_task_assignments')
      .select('*')
      .eq('inspection_task_id', id)
      .maybeSingle();

    const a = assignment as InspectionTaskAssignmentRow | null;
    const pid = a?.worker_id ?? a?.profile_id;
    let worker: ProfileRow | null = null;
    if (pid) {
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', pid).maybeSingle();
      if (prof) worker = prof as ProfileRow;
    }

    return {
      data: {
        task: taskRow as InspectionTaskRow,
        items: (items ?? []) as InspectionTaskItemRow[],
        assignment: a,
        worker,
      },
      error: null,
    };
  } catch (e) {
    console.error('[inspectionTasksApi.detail]', e);
    return {
      data: empty,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

export type CreateTaskPayload = {
  title: string;
  site_name: string;
  area_name: string;
  shift_label: string;
  instructions: string;
  due_at: string | null;
  worker_id: string | null;
};

export type CreateTaskItemPayload = {
  equipment_name: string;
  equipment_location: string;
  equipment_code: string;
};

export async function createInspectionTask(
  payload: CreateTaskPayload,
  items: CreateTaskItemPayload[],
): Promise<SupabaseResult<{ taskId: string | null }>> {
  if (!isSupabaseConfigured()) {
    console.warn('[inspectionTasksApi.create] Supabase не настроен, payload:', payload, items);
    return { data: { taskId: null }, error: null };
  }
  try {
    const supabase = getSupabaseClient();
    const insertRow: Record<string, unknown> = {
      title: payload.title,
      site_name: payload.site_name,
      area_name: payload.area_name,
      shift_label: payload.shift_label,
      instructions: payload.instructions,
      due_at: payload.due_at,
      status: 'draft',
    };

    const { data: created, error: insErr } = await supabase
      .from('inspection_tasks')
      .insert(insertRow)
      .select('id')
      .single();

    if (insErr) {
      return { data: { taskId: null }, error: insErr.message };
    }
    const taskId = (created as { id?: string })?.id ?? null;
    if (!taskId) {
      return { data: { taskId: null }, error: 'Не удалось получить id задания' };
    }

    if (items.length > 0) {
      const rows = items.map((it) => ({
        inspection_task_id: taskId,
        equipment_name: it.equipment_name,
        equipment_location: it.equipment_location,
        equipment_code: it.equipment_code || null,
      }));
      const { error: itemsErr } = await supabase.from('inspection_task_items').insert(rows);
      if (itemsErr) {
        console.error('[inspectionTasksApi.create items]', itemsErr);
      }
    }

    if (payload.worker_id) {
      const { error: asgErr } = await supabase.from('inspection_task_assignments').insert({
        inspection_task_id: taskId,
        worker_id: payload.worker_id,
      });
      if (asgErr) {
        const alt = await supabase.from('inspection_task_assignments').insert({
          inspection_task_id: taskId,
          profile_id: payload.worker_id,
        });
        if (alt.error) {
          console.error('[inspectionTasksApi.create assignment]', asgErr, alt.error);
        }
      }
    }

    return { data: { taskId }, error: null };
  } catch (e) {
    console.error('[inspectionTasksApi.create]', e);
    return {
      data: { taskId: null },
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
