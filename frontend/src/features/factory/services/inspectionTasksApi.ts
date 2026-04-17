import type { PostgrestError } from '@supabase/supabase-js';
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

function logPostgrest(context: string, err: PostgrestError) {
  console.error(`[inspectionTasksApi] ${context}`, {
    message: err.message,
    code: err.code,
    details: err.details,
    hint: err.hint,
  });
}

/** Сообщение для админки (RU), с деталями PostgREST / RLS. */
function ruPostgrestMessage(
  stage: 'tasks' | 'items' | 'assignment' | 'list' | 'detail',
  err: PostgrestError,
): string {
  logPostgrest(stage, err);
  const parts = [err.message, err.details, err.hint].filter(Boolean);
  const tech = parts.join(' · ');
  const rls =
    err.code === '42501' ||
    /permission denied|row-level security|new row violates row-level security/i.test(
      err.message,
    );
  const stageRu =
    stage === 'tasks'
      ? 'Сохранение задания'
      : stage === 'items'
        ? 'Сохранение позиций маршрута'
        : stage === 'assignment'
          ? 'Назначение исполнителя'
          : stage === 'list'
            ? 'Загрузка списка заданий'
            : 'Загрузка задания';
  const rlsRu = rls ? 'Недостаточно прав доступа. ' : '';
  return `${stageRu}: ${rlsRu}${tech}`.trim();
}

function assignmentWorkerId(a: InspectionTaskAssignmentRow | null): string | null {
  if (!a) return null;
  const id = a.worker_user_id ?? a.worker_id ?? a.profile_id;
  return id ? String(id) : null;
}

async function deleteTaskForRollback(supabase: ReturnType<typeof getSupabaseClient>, taskId: string) {
  const { error } = await supabase.from('inspection_tasks').delete().eq('id', taskId);
  if (error) {
    logPostgrest('rollback_delete_task', error);
    console.error('[inspectionTasksApi.create] Не удалось откатить задание после ошибки:', taskId);
  }
}

export async function fetchInspectionTasks(): Promise<SupabaseResult<TaskWithExtras[]>> {
  if (!isSupabaseConfigured()) {
    return { data: [], error: null };
  }
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('inspection_tasks').select('*').limit(500);

    if (error) {
      return { data: [], error: ruPostgrestMessage('list', error) };
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
          .eq('task_id', r.id);
        if (typeof count === 'number') items_count = count;
      } catch {
        /* таблица может отсутствовать */
      }
      try {
        const { data: assignment } = await supabase
          .from('inspection_task_assignments')
          .select('worker_user_id, worker_id, profile_id, task_id')
          .eq('task_id', r.id)
          .maybeSingle();
        const a = assignment as InspectionTaskAssignmentRow | null;
        const pid = assignmentWorkerId(a);
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
      return { data: empty, error: ruPostgrestMessage('detail', taskErr) };
    }
    if (!taskRow) {
      return { data: empty, error: 'Задание не найдено' };
    }

    const itemsRes = await supabase
      .from('inspection_task_items')
      .select('*')
      .eq('task_id', id)
      .order('sort_order', { ascending: true });

    let itemRows = (itemsRes.data ?? []) as InspectionTaskItemRow[];
    let itemsErrorMsg = itemsRes.error ? ruPostgrestMessage('detail', itemsRes.error) : null;

    if (!itemsRes.error && itemRows.length === 0) {
      const legacy = await supabase
        .from('inspection_task_items')
        .select('*')
        .eq('inspection_task_id', id)
        .order('sort_order', { ascending: true });
      if (legacy.error) {
        if (import.meta.env.DEV) {
          console.debug(
            '[inspectionTasksApi.detail] no rows via task_id; legacy inspection_task_id query:',
            legacy.error.message,
          );
        }
      } else if ((legacy.data?.length ?? 0) > 0) {
        itemRows = (legacy.data ?? []) as InspectionTaskItemRow[];
        if (import.meta.env.DEV) {
          console.warn(
            '[inspectionTasksApi.detail] loaded inspection_task_items via legacy column inspection_task_id',
          );
        }
      }
    }

    const { data: assignment, error: asgErr } = await supabase
      .from('inspection_task_assignments')
      .select('*')
      .eq('task_id', id)
      .maybeSingle();

    const asgErrorMsg = asgErr ? ruPostgrestMessage('detail', asgErr) : null;

    const a = asgErr ? null : (assignment as InspectionTaskAssignmentRow | null);
    const pid = assignmentWorkerId(a);
    let worker: ProfileRow | null = null;
    if (pid) {
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', pid).maybeSingle();
      if (prof) worker = prof as ProfileRow;
    }

    return {
      data: {
        task: taskRow as InspectionTaskRow,
        items: itemRows,
        assignment: a,
        worker,
      },
      error: itemsErrorMsg ?? asgErrorMsg,
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
    console.warn('[inspectionTasksApi.create] Нет VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY');
    return {
      data: { taskId: null },
      error:
        'Сохранение недоступно: не настроено подключение к данным.',
    };
  }

  const workerUserId = payload.worker_id?.trim() || null;
  if (!workerUserId) {
    return {
      data: { taskId: null },
      error: 'Выберите исполнителя (worker_user_id обязателен для назначения).',
    };
  }

  if (items.length < 1) {
    console.warn('[inspectionTasksApi.create] нет позиций маршрута (inspection_task_items)');
    return {
      data: { taskId: null },
      error:
        'Добавьте хотя бы одну позицию оборудования с названием — без маршрута задание не сохраняется в общую базу.',
    };
  }

  try {
    const supabase = getSupabaseClient();
    const {
      data: { session },
      error: sessionErr,
    } = await supabase.auth.getSession();

    if (sessionErr) {
      console.error('[inspectionTasksApi.create] session', sessionErr);
      return {
        data: { taskId: null },
        error: `Ошибка сессии: ${sessionErr.message}`,
      };
    }
    const adminUserId = session?.user?.id;
    if (!adminUserId) {
      console.error('[inspectionTasksApi.create] Нет активной сессии (auth.getSession)');
      return {
        data: { taskId: null },
        error:
          'Войдите в панель под учётной записью администратора и повторите сохранение.',
      };
    }

    const insertRow: Record<string, unknown> = {
      title: payload.title,
      site_name: payload.site_name || null,
      area_name: payload.area_name || null,
      shift_label: payload.shift_label || null,
      instructions: payload.instructions || null,
      due_at: payload.due_at,
      status: 'assigned',
      created_by: adminUserId,
    };

    const { data: created, error: insErr } = await supabase
      .from('inspection_tasks')
      .insert(insertRow)
      .select('id')
      .single();

    if (insErr) {
      return { data: { taskId: null }, error: ruPostgrestMessage('tasks', insErr) };
    }
    const taskId = (created as { id?: string })?.id ?? null;
    if (!taskId) {
      return { data: { taskId: null }, error: 'Не удалось получить id задания после вставки.' };
    }

    const rows = items.map((it, i) => ({
      task_id: taskId,
      sort_order: i + 1,
      equipment_name: it.equipment_name.trim(),
      equipment_location: it.equipment_location.trim() || null,
      equipment_code: it.equipment_code.trim() || null,
    }));
    const { error: itemsErr } = await supabase.from('inspection_task_items').insert(rows);
    if (itemsErr) {
      if (import.meta.env.DEV) {
        console.error('[inspectionTasksApi.create] inspection_task_items insert failed', {
          taskId,
          rowCount: rows.length,
          sample: rows[0],
        });
      }
      await deleteTaskForRollback(supabase, taskId);
      return { data: { taskId: null }, error: ruPostgrestMessage('items', itemsErr) };
    }
    if (import.meta.env.DEV) {
      console.info('[inspectionTasksApi.create] inspection_task_items OK', {
        taskId,
        inserted: rows.length,
      });
    }

    const assignedAt = new Date().toISOString();
    const { error: asgErr } = await supabase.from('inspection_task_assignments').insert({
      task_id: taskId,
      worker_user_id: workerUserId,
      assigned_by: adminUserId,
      assigned_at: assignedAt,
      is_active: true,
      execution_status: 'assigned',
    });

    if (asgErr) {
      if (import.meta.env.DEV) {
        console.error('[inspectionTasksApi.create] inspection_task_assignments insert failed', {
          taskId,
          worker_user_id: workerUserId,
        });
      }
      await deleteTaskForRollback(supabase, taskId);
      return { data: { taskId: null }, error: ruPostgrestMessage('assignment', asgErr) };
    }

    if (import.meta.env.DEV) {
      console.info('[inspectionTasksApi.create] done', {
        taskId,
        items: rows.length,
        worker_user_id: workerUserId,
      });
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
