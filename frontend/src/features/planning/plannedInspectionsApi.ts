import type { PostgrestError } from '@supabase/supabase-js';
import type {
  InspectionTaskAssignmentRow,
  InspectionTaskRow,
  PlannedInspectionItemRow,
  PlannedInspectionRow,
  SupabaseResult,
} from '@/entities/factory/model/types';
import { getSupabaseClient, isSupabaseConfigured } from '@/shared/lib/supabase/client';
import type { CreateTaskItemPayload } from '@/features/factory/services/inspectionTasksApi';

function logPostgrest(context: string, err: PostgrestError) {
  console.error(`[plannedInspectionsApi] ${context}`, {
    message: err.message,
    code: err.code,
    details: err.details,
    hint: err.hint,
  });
}

function ruMessage(stage: string, err: PostgrestError): string {
  logPostgrest(stage, err);
  const parts = [err.message, err.details, err.hint].filter(Boolean);
  return `${stage}: ${parts.join(' · ')}`.trim();
}

export type PlannedInspectionBundle = PlannedInspectionRow & {
  planned_inspection_items?: PlannedInspectionItemRow[] | null;
  /** Заполняется после обогащения */
  dispatched_task?: Pick<InspectionTaskRow, 'id' | 'status'> | null;
  dispatched_assignment?: Pick<InspectionTaskAssignmentRow, 'task_id' | 'execution_status'> | null;
};

export type PlannedPatrolUiKind =
  | 'cancelled'
  | 'scheduled'
  | 'scheduled_overdue'
  | 'dispatched_assigned'
  | 'dispatched_progress'
  | 'dispatched_done'
  | 'dispatched_issues';

export function plannedPatrolUi(
  row: PlannedInspectionBundle,
  nowMs: number = Date.now(),
): { kind: PlannedPatrolUiKind; label: string; color: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' } {
  const st = String(row.status ?? '');
  if (st === 'cancelled') {
    return { kind: 'cancelled', label: 'Отменён', color: 'default' };
  }

  const scheduledAt = row.scheduled_at ? Date.parse(row.scheduled_at) : NaN;

  if (st === 'scheduled') {
    if (!Number.isFinite(scheduledAt)) {
      return { kind: 'scheduled', label: 'Запланирован', color: 'primary' };
    }
    if (scheduledAt > nowMs) {
      return { kind: 'scheduled', label: 'Запланирован', color: 'primary' };
    }
    return {
      kind: 'scheduled_overdue',
      label: 'Не отправлено (ожидалась выдача)',
      color: 'error',
    };
  }

  if (st === 'dispatched') {
    const ex = String(row.dispatched_assignment?.execution_status ?? '');
    if (ex === 'completed') {
      return { kind: 'dispatched_done', label: 'Выполнен', color: 'success' };
    }
    if (ex === 'completed_with_issues') {
      return { kind: 'dispatched_issues', label: 'Завершён с замечаниями', color: 'warning' };
    }
    if (ex === 'in_progress') {
      return { kind: 'dispatched_progress', label: 'В работе', color: 'info' };
    }
    const tSt = String(row.dispatched_task?.status ?? '');
    if (tSt === 'completed' || tSt === 'completed_with_issues') {
      return {
        kind: tSt === 'completed' ? 'dispatched_done' : 'dispatched_issues',
        label: tSt === 'completed' ? 'Выполнен' : 'Завершён с замечаниями',
        color: tSt === 'completed' ? 'success' : 'warning',
      };
    }
    return { kind: 'dispatched_assigned', label: 'Выдано исполнителю', color: 'info' };
  }

  return { kind: 'scheduled', label: String(row.status ?? '—'), color: 'default' };
}

/** Ключ локального дня YYYY-MM-DD для группировки в календаре */
export function localDayKeyFromIso(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export async function fetchPlannedInspectionsInRange(
  rangeStartIso: string,
  rangeEndIso: string,
): Promise<SupabaseResult<PlannedInspectionBundle[]>> {
  if (!isSupabaseConfigured()) {
    return { data: [], error: null };
  }
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('planned_inspections')
      .select('*, planned_inspection_items(*)')
      .gte('scheduled_at', rangeStartIso)
      .lte('scheduled_at', rangeEndIso)
      .order('scheduled_at', { ascending: true });

    if (error) {
      return { data: [], error: ruMessage('Загрузка планов', error) };
    }

    const rows = (data ?? []) as PlannedInspectionBundle[];
    const taskIds = [
      ...new Set(
        rows
          .map((r) => r.dispatched_task_id)
          .filter((id): id is string => Boolean(id && String(id).length)),
      ),
    ];

    if (taskIds.length === 0) {
      return { data: rows, error: null };
    }

    const [{ data: tasks, error: tErr }, { data: asgs, error: aErr }] = await Promise.all([
      supabase.from('inspection_tasks').select('id,status').in('id', taskIds),
      supabase.from('inspection_task_assignments').select('task_id,execution_status').in('task_id', taskIds),
    ]);

    if (tErr) {
      return { data: rows, error: ruMessage('Загрузка связанных заданий', tErr) };
    }
    if (aErr) {
      return { data: rows, error: ruMessage('Загрузка назначений', aErr) };
    }

    const taskById = new Map<string, Pick<InspectionTaskRow, 'id' | 'status'>>();
    for (const t of tasks ?? []) {
      const row = t as InspectionTaskRow;
      if (row.id) taskById.set(String(row.id), { id: row.id, status: row.status ?? null });
    }

    const asgByTask = new Map<string, Pick<InspectionTaskAssignmentRow, 'task_id' | 'execution_status'>>();
    for (const a of asgs ?? []) {
      const row = a as InspectionTaskAssignmentRow;
      const tid = row.task_id ? String(row.task_id) : '';
      if (tid) asgByTask.set(tid, { task_id: tid, execution_status: row.execution_status ?? null });
    }

    for (const r of rows) {
      const tid = r.dispatched_task_id ? String(r.dispatched_task_id) : '';
      if (!tid) continue;
      r.dispatched_task = taskById.get(tid) ?? null;
      r.dispatched_assignment = asgByTask.get(tid) ?? null;
    }

    return { data: rows, error: null };
  } catch (e) {
    console.error('[plannedInspectionsApi.fetchRange]', e);
    return { data: [], error: e instanceof Error ? e.message : String(e) };
  }
}

export async function createPlannedInspection(
  payload: {
    title: string;
    site_name: string;
    area_name: string;
    shift_label: string;
    instructions: string;
    scheduled_at: string;
    worker_user_id: string;
  },
  items: CreateTaskItemPayload[],
): Promise<SupabaseResult<{ id: string | null }>> {
  if (!isSupabaseConfigured()) {
    return {
      data: { id: null },
      error:
        'Сохранение недоступно: не настроено подключение к данным.',
    };
  }
  if (!payload.worker_user_id?.trim()) {
    return { data: { id: null }, error: 'Выберите исполнителя.' };
  }
  if (items.length < 1) {
    return { data: { id: null }, error: 'Добавьте хотя бы одну позицию маршрута.' };
  }

  try {
    const supabase = getSupabaseClient();
    const {
      data: { session },
      error: sessionErr,
    } = await supabase.auth.getSession();
    if (sessionErr) {
      return { data: { id: null }, error: `Сессия: ${sessionErr.message}` };
    }
    const adminUserId = session?.user?.id;
    if (!adminUserId) {
      return { data: { id: null }, error: 'Войдите под учётной записью администратора.' };
    }

    const { data: created, error: insErr } = await supabase
      .from('planned_inspections')
      .insert({
        title: payload.title.trim(),
        site_name: payload.site_name || null,
        area_name: payload.area_name || null,
        shift_label: payload.shift_label || null,
        instructions: payload.instructions || null,
        scheduled_at: payload.scheduled_at,
        worker_user_id: payload.worker_user_id.trim(),
        status: 'scheduled',
        created_by: adminUserId,
      })
      .select('id')
      .single();

    if (insErr) {
      return { data: { id: null }, error: ruMessage('Сохранение плана', insErr) };
    }

    const planId = (created as { id?: string })?.id ?? null;
    if (!planId) {
      return { data: { id: null }, error: 'Не удалось получить id плана.' };
    }

    const itemRows = items.map((it, i) => ({
      planned_inspection_id: planId,
      sort_order: i,
      equipment_name: it.equipment_name,
      equipment_location: it.equipment_location || null,
      equipment_code: it.equipment_code || null,
    }));

    const { error: itemsErr } = await supabase.from('planned_inspection_items').insert(itemRows);
    if (itemsErr) {
      await supabase.from('planned_inspections').delete().eq('id', planId);
      return { data: { id: null }, error: ruMessage('Позиции маршрута плана', itemsErr) };
    }

    return { data: { id: planId }, error: null };
  } catch (e) {
    console.error('[plannedInspectionsApi.create]', e);
    return { data: { id: null }, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function cancelPlannedInspection(planId: string): Promise<SupabaseResult<void>> {
  if (!isSupabaseConfigured()) {
    return { data: undefined, error: 'Операция недоступна: не настроено подключение к данным.' };
  }
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('planned_inspections')
      .update({ status: 'cancelled' })
      .eq('id', planId)
      .eq('status', 'scheduled');
    if (error) {
      return { data: undefined, error: ruMessage('Отмена плана', error) };
    }
    return { data: undefined, error: null };
  } catch (e) {
    return { data: undefined, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function dispatchPlannedInspectionsDue(): Promise<SupabaseResult<number>> {
  if (!isSupabaseConfigured()) {
    return { data: 0, error: 'Операция недоступна: не настроено подключение к данным.' };
  }
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.rpc('dispatch_planned_inspections_due');
    if (error) {
      return { data: 0, error: ruMessage('Выдача запланированных', error) };
    }
    const n = typeof data === 'number' ? data : Number(data);
    return { data: Number.isFinite(n) ? n : 0, error: null };
  } catch (e) {
    return { data: 0, error: e instanceof Error ? e.message : String(e) };
  }
}
