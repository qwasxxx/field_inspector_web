import type { PostgrestError } from '@supabase/supabase-js';
import type { EquipmentRedAlertRow, SupabaseResult } from '@/entities/factory/model/types';
import { getSupabaseClient, isSupabaseConfigured } from '@/shared/lib/supabase/client';

export const RED_ALERT_STATUSES = ['open', 'acknowledged', 'resolved', 'dismissed'] as const;
export type RedAlertStatus = (typeof RED_ALERT_STATUSES)[number];

export const RED_ALERT_SEVERITIES = ['critical', 'high', 'medium', 'low'] as const;
export type RedAlertSeverity = (typeof RED_ALERT_SEVERITIES)[number];

export type RedAlertFilters = {
  status: RedAlertStatus | '';
  severity: RedAlertSeverity | '';
  equipmentSearch: string;
  workerSearch: string;
};

function logErr(ctx: string, err: PostgrestError) {
  console.error(`[equipmentRedAlertsApi] ${ctx}`, err.message, err.code, err.details);
}

function ruErr(stage: string, err: PostgrestError): string {
  logErr(stage, err);
  const rls =
    err.code === '42501' ||
    /permission denied|row-level security|new row violates row-level security/i.test(err.message);
  const rlsRu = rls ? 'Отклонено политикой безопасности (RLS). ' : '';
  return `${stage}: ${rlsRu}${err.message}`.trim();
}

const STATUS_SORT: Record<string, number> = {
  open: 0,
  acknowledged: 1,
  resolved: 2,
  dismissed: 3,
};

/** Открытые сначала, внутри группы — новее первыми. */
export function sortRedAlertsForDisplay(rows: EquipmentRedAlertRow[]): EquipmentRedAlertRow[] {
  return [...rows].sort((a, b) => {
    const sa = STATUS_SORT[String(a.status ?? '')] ?? 99;
    const sb = STATUS_SORT[String(b.status ?? '')] ?? 99;
    if (sa !== sb) return sa - sb;
    const ta = new Date(String(a.created_at ?? 0)).getTime();
    const tb = new Date(String(b.created_at ?? 0)).getTime();
    return tb - ta;
  });
}

export async function fetchEquipmentRedAlerts(
  filters: RedAlertFilters,
): Promise<SupabaseResult<EquipmentRedAlertRow[]>> {
  if (!isSupabaseConfigured()) {
    return { data: [], error: null };
  }
  try {
    const supabase = getSupabaseClient();
    let q = supabase.from('equipment_red_alerts').select('*');

    if (filters.status) {
      q = q.eq('status', filters.status);
    }
    if (filters.severity) {
      q = q.eq('severity', filters.severity);
    }
    const eq = filters.equipmentSearch.trim();
    if (eq) {
      q = q.or(`equipment_name.ilike.%${eq}%,equipment_id.ilike.%${eq}%`);
    }
    const w = filters.workerSearch.trim();
    if (w) {
      q = q.ilike('triggered_by_name', `%${w}%`);
    }

    const { data, error } = await q.order('created_at', { ascending: false }).limit(500);

    if (error) {
      return { data: [], error: ruErr('Загрузка тревог', error) };
    }
    const rows = sortRedAlertsForDisplay((data ?? []) as EquipmentRedAlertRow[]);
    return { data: rows, error: null };
  } catch (e) {
    console.error('[equipmentRedAlertsApi.fetchEquipmentRedAlerts]', e);
    return { data: [], error: e instanceof Error ? e.message : String(e) };
  }
}

/** Открытые тревоги с severity critical или high (для дашборда). */
export async function fetchOpenCriticalRedAlertsCount(): Promise<SupabaseResult<number>> {
  if (!isSupabaseConfigured()) {
    return { data: 0, error: null };
  }
  try {
    const supabase = getSupabaseClient();
    const { count, error } = await supabase
      .from('equipment_red_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'open')
      .in('severity', ['critical', 'high']);

    if (error) {
      return { data: 0, error: ruErr('Счётчик тревог', error) };
    }
    return { data: typeof count === 'number' ? count : 0, error: null };
  } catch (e) {
    console.error('[equipmentRedAlertsApi.fetchOpenCriticalRedAlertsCount]', e);
    return { data: 0, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function fetchRedAlertsForTask(
  taskId: string | undefined,
): Promise<SupabaseResult<EquipmentRedAlertRow[]>> {
  const tid = taskId?.trim();
  if (!tid || !isSupabaseConfigured()) {
    return { data: [], error: null };
  }
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('equipment_red_alerts')
      .select('*')
      .eq('task_id', tid)
      .in('status', ['open', 'acknowledged'])
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return { data: [], error: ruErr('Тревоги по заданию', error) };
    }
    return { data: (data ?? []) as EquipmentRedAlertRow[], error: null };
  } catch (e) {
    console.error('[equipmentRedAlertsApi.fetchRedAlertsForTask]', e);
    return { data: [], error: e instanceof Error ? e.message : String(e) };
  }
}

export type RedAlertAdminAction = 'acknowledge' | 'resolve' | 'dismiss';

export async function updateRedAlertAdmin(
  alertId: string,
  action: RedAlertAdminAction,
): Promise<SupabaseResult<void>> {
  if (!isSupabaseConfigured()) {
    return { data: undefined, error: 'Supabase не настроен.' };
  }
  const id = alertId?.trim();
  if (!id) {
    return { data: undefined, error: 'Не указан id тревоги.' };
  }

  const supabase = getSupabaseClient();
  const {
    data: { session },
    error: sessionErr,
  } = await supabase.auth.getSession();
  if (sessionErr || !session?.user?.id) {
    return { data: undefined, error: 'Нет сессии администратора.' };
  }
  const userId = session.user.id;
  const now = new Date().toISOString();

  const patch: Record<string, unknown> = {};
  if (action === 'acknowledge') {
    patch.status = 'acknowledged';
    patch.acknowledged_by = userId;
    patch.acknowledged_at = now;
  } else if (action === 'resolve') {
    patch.status = 'resolved';
    patch.resolved_by = userId;
    patch.resolved_at = now;
  } else if (action === 'dismiss') {
    patch.status = 'dismissed';
  }

  try {
    const { error } = await supabase.from('equipment_red_alerts').update(patch).eq('id', id);
    if (error) {
      return { data: undefined, error: ruErr('Обновление тревоги', error) };
    }
    return { data: undefined, error: null };
  } catch (e) {
    console.error('[equipmentRedAlertsApi.updateRedAlertAdmin]', e);
    return { data: undefined, error: e instanceof Error ? e.message : String(e) };
  }
}

export type RedAlertRealtimeStatus = 'SUBSCRIBED' | 'CHANNEL_ERROR' | 'TIMED_OUT' | 'CLOSED' | string;

export function subscribeEquipmentRedAlertsRealtime(options: {
  onChange: () => void;
  onStatus: (status: RedAlertRealtimeStatus) => void;
}): () => void {
  if (!isSupabaseConfigured()) {
    return () => {};
  }
  const supabase = getSupabaseClient();
  const channel = supabase
    .channel('equipment-red-alerts-admin')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'equipment_red_alerts' },
      () => options.onChange(),
    );

  channel.subscribe((status) => {
    options.onStatus(status);
    if (status === 'SUBSCRIBED') {
      options.onChange();
    }
  });

  return () => {
    void supabase.removeChannel(channel);
  };
}
