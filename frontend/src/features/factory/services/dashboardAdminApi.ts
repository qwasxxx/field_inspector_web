/**
 * Дашборд администратора: агрегация из Supabase (задания, назначения, отчёты, профили).
 */

import type {
  CriticalDefectAlert,
  DashboardEmployee,
  DashboardMetric,
  EmployeeShiftStatus,
  ShiftContext,
  ShiftEvent,
  ShiftEventType,
  ShiftProgressItem,
} from '@/entities/dashboard/model/types';
import type { InspectionTaskAssignmentRow, ProfileRow } from '@/entities/factory/model/types';
import type { InspectionReportRow } from '@/features/factory/services/inspectionReportsApi';
import { getSupabaseClient, isSupabaseConfigured } from '@/shared/lib/supabase/client';
import { formatDateRu, type ShiftInfo } from '@/utils/shiftUtils';

const OFFLINE_MS = 35 * 60 * 1000;
const NORM_MINUTES = 12;

export type DashboardBundle = {
  shiftContext: ShiftContext;
  metrics: DashboardMetric[];
  employees: DashboardEmployee[];
  events: ShiftEvent[];
  progress: ShiftProgressItem[];
  criticalAlert: CriticalDefectAlert | null;
};

export type DashboardFetchResult = {
  data: DashboardBundle | null;
  error: string | null;
};

/** Пустое состояние, если Supabase не настроен. */
export function emptyDashboardBundle(): DashboardBundle {
  return {
    shiftContext: {
      shiftNumber: '—',
      dateLabel: todayDateLabel(),
      siteLabel: '—',
      onlineCurrent: 0,
      onlineTotal: 0,
    },
    metrics: [
      { id: 'm1', title: 'Выполнено объектов', value: '—', caption: 'подключите Supabase' },
      { id: 'm2', title: 'Активных обходчиков', value: '—', caption: '—' },
      { id: 'm3', title: 'Дефектов за смену', value: '—', caption: '—' },
      { id: 'm4', title: 'Ср. время на объект', value: '—', caption: `норма: ${NORM_MINUTES} мин` },
    ],
    employees: [],
    events: [],
    progress: [],
    criticalAlert: null,
  };
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

function todayDateLabel(): string {
  const d = new Date();
  const rest = d.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return `Сегодня, ${rest}`;
}

function timeHm(iso: string | null | undefined): string {
  if (iso == null || iso === '') return '—';
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '—';
  return new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function startOfLocalDay(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Типичные тестовые подписи площадки на турецком → русский для дашборда. */
function localizeSiteAreaPart(raw: string | null | undefined): string {
  if (raw == null) return '';
  let s = String(raw).trim();
  if (!s) return '';
  const rules: [RegExp, string][] = [
    [/ana\s+tesis/gi, 'Главный объект'],
    [/bölge\s+([a-z0-9]+)/gi, 'Участок $1'],
    [/bölge/gi, 'Участок'],
  ];
  for (const [re, rep] of rules) {
    s = s.replace(re, rep);
  }
  return s.replace(/\s+/g, ' ').trim();
}

/**
 * Если shift_label в БД похож на случайный набор букв (cece и т.п.), показываем номер дня месяца —
 * понятный ориентир «смена за сегодня».
 */
function isUnusableShiftLabel(raw: string): boolean {
  const t = raw.trim();
  if (t.length === 0) return true;
  if (/\d/.test(t)) return false;
  const low = t.toLowerCase();
  if (low.length <= 3 && /^[a-zа-яё]+$/i.test(t)) return true;
  if (/^(.)\1{2,}$/.test(low)) return true;
  if (/^(.{2})\1+$/.test(low)) return true;
  return false;
}

function resolveShiftNumberForDisplay(shiftLabel: string | null | undefined): string {
  const raw = (shiftLabel ?? '').trim();
  if (raw && !isUnusableShiftLabel(raw)) return raw;
  return String(new Date().getDate());
}

export type BuildDashboardBundleOptions = {
  /** «Текущее время» для логики онлайн/офлайн (для прошлых смен — конец окна). */
  referenceMs: number;
  shiftWindowStartMs: number;
  shiftWindowEndMs: number;
  shiftDisplay: { shiftNumber: string; dateLabel: string };
};

/** @internal exported for tests */
export function buildDashboardBundle(
  input: {
    tasks: Array<{
      id: string;
      status: string | null;
      title?: string | null;
      shift_label?: string | null;
      site_name?: string | null;
      area_name?: string | null;
      created_at?: string | null;
    }>;
    items: Array<{ id: string; task_id: string | null }>;
    assignments: InspectionTaskAssignmentRow[];
    reports: InspectionReportRow[];
    workers: ProfileRow[];
  },
  options?: BuildDashboardBundleOptions,
): DashboardBundle {
  const referenceMs = options?.referenceMs ?? Date.now();
  const windowStart = options?.shiftWindowStartMs ?? startOfLocalDay().getTime();
  const windowEnd = options?.shiftWindowEndMs ?? Number.MAX_SAFE_INTEGER;
  const taskById = new Map(input.tasks.map((t) => [t.id, t]));
  const itemsByTask = new Map<string, string[]>();
  for (const it of input.items) {
    const tid = it.task_id;
    if (!tid) continue;
    const list = itemsByTask.get(tid) ?? [];
    list.push(it.id);
    itemsByTask.set(tid, list);
  }

  const totalItems = input.items.length;
  const reportedKeys = new Set<string>();
  for (const r of input.reports) {
    if (r.task_id && r.equipment_id) {
      reportedKeys.add(`${r.task_id}:${r.equipment_id}`);
    }
  }
  for (const t of input.tasks) {
    if (t.status === 'completed' || t.status === 'completed_with_issues') {
      const ids = itemsByTask.get(t.id) ?? [];
      for (const iid of ids) reportedKeys.add(`${t.id}:${iid}`);
    }
  }
  let doneItems = 0;
  for (const it of input.items) {
    const tid = it.task_id;
    if (!tid) continue;
    if (reportedKeys.has(`${tid}:${it.id}`)) doneItems += 1;
  }

  const pct =
    totalItems > 0 ? Math.min(100, Math.round((100 * doneItems) / totalItems)) : 0;

  const activeWorkerIds = new Set(
    input.workers.map((w) => w.id).filter(Boolean) as string[],
  );
  const onlineWorkers = new Set<string>();
  const now = referenceMs;
  for (const a of input.assignments) {
    if (!a.is_active || !a.worker_user_id) continue;
    const st = a.execution_status;
    const lp = a.last_progress_at ? Date.parse(String(a.last_progress_at)) : NaN;
    if (st === 'in_progress') {
      onlineWorkers.add(a.worker_user_id as string);
      continue;
    }
    if (!Number.isNaN(lp) && now - lp < OFFLINE_MS) {
      onlineWorkers.add(a.worker_user_id as string);
    }
  }

  const assignmentsByWorker = new Map<string, InspectionTaskAssignmentRow>();
  const sortedA = [...input.assignments].sort((x, y) => {
    const ax = x.assigned_at ? Date.parse(String(x.assigned_at)) : 0;
    const ay = y.assigned_at ? Date.parse(String(y.assigned_at)) : 0;
    return ay - ax;
  });
  for (const a of sortedA) {
    if (!a.worker_user_id || !a.is_active) continue;
    if (!assignmentsByWorker.has(a.worker_user_id as string)) {
      assignmentsByWorker.set(a.worker_user_id as string, a);
    }
  }

  const shiftLabel =
    [...input.tasks]
      .filter((t) => t.shift_label && String(t.shift_label).trim())
      .sort((a, b) => {
        const ta = a.created_at ? Date.parse(String(a.created_at)) : 0;
        const tb = b.created_at ? Date.parse(String(b.created_at)) : 0;
        return tb - ta;
      })[0]?.shift_label ?? '—';

  const runningTasks = input.tasks.filter((t) =>
    ['assigned', 'in_progress'].includes(String(t.status)),
  );
  const formatSite = (t: (typeof input.tasks)[0]) => {
    const a = localizeSiteAreaPart(t.site_name);
    const b = localizeSiteAreaPart(t.area_name);
    return [a, b].filter(Boolean).join(', ');
  };
  const siteParts = runningTasks.map(formatSite).filter((s) => s.length > 0);
  const siteLabelRaw =
    siteParts[0] ??
    [...input.tasks]
      .sort((a, b) => {
        const ta = a.created_at ? Date.parse(String(a.created_at)) : 0;
        const tb = b.created_at ? Date.parse(String(b.created_at)) : 0;
        return tb - ta;
      })
      .map(formatSite)
      .find((s) => s.length > 0) ??
    '—';
  const siteLabel = siteLabelRaw === '—' ? '—' : siteLabelRaw;

  const shiftContext: ShiftContext = options
    ? {
        shiftNumber: options.shiftDisplay.shiftNumber,
        dateLabel: options.shiftDisplay.dateLabel,
        siteLabel,
        onlineCurrent: onlineWorkers.size,
        onlineTotal: Math.max(
          input.workers.filter((w) => w.is_active !== false).length,
          activeWorkerIds.size,
        ),
      }
    : {
        shiftNumber: resolveShiftNumberForDisplay(shiftLabel === '—' ? null : String(shiftLabel)),
        dateLabel: todayDateLabel(),
        siteLabel,
        onlineCurrent: onlineWorkers.size,
        onlineTotal: Math.max(
          input.workers.filter((w) => w.is_active !== false).length,
          activeWorkerIds.size,
        ),
      };

  const defectsToday = input.reports.filter((r) => {
    if (!r.defect_found || !r.created_at) return false;
    const t = Date.parse(String(r.created_at));
    return !Number.isNaN(t) && t >= windowStart && t < windowEnd;
  });
  const criticalDefectsToday = defectsToday.filter(
    (r) =>
      String(r.defect_priority ?? '').toLowerCase() === 'high' ||
      String(r.defect_priority ?? '').toLowerCase() === 'critical',
  );

  const durations = input.assignments
    .map((a) => a.duration_minutes)
    .filter((n): n is number => typeof n === 'number' && n > 0);
  const avgMin =
    durations.length > 0
      ? Math.round(durations.reduce((s, n) => s + n, 0) / durations.length)
      : 0;

  const metrics: DashboardMetric[] = [
    {
      id: 'm1',
      title: 'Выполнено объектов',
      value: totalItems > 0 ? `${doneItems} / ${totalItems}` : '0 / 0',
      caption: totalItems > 0 ? `${pct}% по пунктам заданий` : 'нет пунктов в заданиях',
    },
    {
      id: 'm2',
      title: 'Активных обходчиков',
      value: String(onlineWorkers.size),
      caption:
        shiftContext.onlineTotal > 0
          ? `${shiftContext.onlineCurrent} на связи из ${shiftContext.onlineTotal}`
          : 'нет профилей worker',
    },
    {
      id: 'm3',
      title: 'Дефектов за смену',
      value: String(defectsToday.length),
      caption:
        criticalDefectsToday.length > 0
          ? `${criticalDefectsToday.length} критических`
          : 'критических нет',
    },
    {
      id: 'm4',
      title: 'Ср. время на объект',
      value: avgMin > 0 ? `${avgMin} мин` : '—',
      caption: `норма: ${NORM_MINUTES} мин`,
    },
  ];

  const reportsByTask = new Map<string, InspectionReportRow[]>();
  for (const r of input.reports) {
    if (!r.task_id) continue;
    const list = reportsByTask.get(r.task_id) ?? [];
    list.push(r);
    reportsByTask.set(r.task_id, list);
  }

  const employees: DashboardEmployee[] = [];
  for (const w of input.workers) {
    const id = w.id as string | undefined;
    if (!id) continue;
    const name = (w.full_name as string | undefined)?.trim() || w.username || id;
    const a = assignmentsByWorker.get(id);
    let status: EmployeeShiftStatus = 'offline';
    let statusLabel = 'Нет связи';
    let locationHint = '—';

    if (a) {
      const task = a.task_id ? taskById.get(a.task_id as string) : undefined;
      const site = [task?.site_name, task?.area_name].filter(Boolean).join(', ');
      locationHint = site || (task?.title ?? 'Задание');

      const taskReports = a.task_id ? reportsByTask.get(a.task_id as string) ?? [] : [];
      const hasDefect = taskReports.some((r) => r.defect_found);
      const lp = a.last_progress_at ? Date.parse(String(a.last_progress_at)) : NaN;
      const inProg = a.execution_status === 'in_progress';

      if (hasDefect) {
        status = 'defect';
        statusLabel = 'Дефект';
      } else if (inProg) {
        status = 'in_work';
        statusLabel = 'В работе';
      } else if (!Number.isNaN(lp) && now - lp < OFFLINE_MS) {
        status = 'in_work';
        statusLabel = 'В работе';
      } else {
        status = 'offline';
        statusLabel = 'Нет связи';
        const mins = Number.isNaN(lp) ? null : Math.round((now - lp) / 60000);
        locationHint = mins != null && mins > 0 ? `${mins} мин без активности` : locationHint;
      }
    } else {
      status = 'break';
      statusLabel = 'Нет задания';
      locationHint = '—';
    }

    employees.push({
      id,
      name,
      initials: initialsFromName(name),
      status,
      statusLabel,
      locationHint,
    });
  }
  employees.sort((x, y) => x.name.localeCompare(y.name, 'ru'));

  const events: ShiftEvent[] = [];
  const sortedReports = [...input.reports].sort((a, b) => {
    const ta = a.created_at ? Date.parse(String(a.created_at)) : 0;
    const tb = b.created_at ? Date.parse(String(b.created_at)) : 0;
    return tb - ta;
  });

  for (const r of sortedReports.slice(0, 15)) {
    const evType: ShiftEventType = r.defect_found
      ? String(r.defect_priority ?? '').toLowerCase() === 'high' ||
        String(r.defect_priority ?? '').toLowerCase() === 'critical'
        ? 'defect_critical'
        : 'deviation'
      : 'inspection_done';

    const title = r.defect_found
      ? evType === 'defect_critical'
        ? 'Критический дефект'
        : 'Зафиксирован дефект'
      : 'Отчёт по объекту';

    const detailParts = [r.defect_description, r.comment_text].filter(
      (s) => s && String(s).trim(),
    );
    const detail = detailParts.length ? String(detailParts[0]) : 'Без комментария';

    events.push({
      id: `rep-${r.id}`,
      time: timeHm(r.created_at),
      title,
      detail,
      type: evType,
    });
  }

  if (input.tasks.length > 0) {
    const oldest = [...input.tasks].sort((a, b) => {
      const ta = a.created_at ? Date.parse(String(a.created_at)) : 0;
      const tb = b.created_at ? Date.parse(String(b.created_at)) : 0;
      return ta - tb;
    })[0];
    events.push({
      id: 'ev-shift',
      time: oldest?.created_at ? timeHm(oldest.created_at) : '—',
      title: 'Задания в системе',
      detail: `${input.tasks.length} заданий, ${totalItems} пунктов, ${shiftContext.onlineTotal} обходчиков в списке.`,
      type: 'shift_start',
    });
  }

  const progress: ShiftProgressItem[] = [];
  for (const w of input.workers) {
    const id = w.id as string | undefined;
    if (!id) continue;
    const a = assignmentsByWorker.get(id);
    if (!a?.task_id) continue;
    const tids = itemsByTask.get(a.task_id as string) ?? [];
    const total = tids.length;
    if (total <= 0) continue;
    const reps = reportsByTask.get(a.task_id as string) ?? [];
    const done = new Set(reps.map((r) => r.equipment_id)).size;
    const name = (w.full_name as string | undefined)?.trim() || w.username || id;
    progress.push({
      id: `prog-${id}`,
      name,
      current: Math.min(done, total),
      total,
    });
  }
  progress.sort((x, y) => x.name.localeCompare(y.name, 'ru'));

  let criticalAlert: CriticalDefectAlert | null = null;
  const crit = [...input.reports]
    .filter((r) => r.defect_found)
    .sort((a, b) => {
      const ta = a.created_at ? Date.parse(String(a.created_at)) : 0;
      const tb = b.created_at ? Date.parse(String(b.created_at)) : 0;
      return tb - ta;
    })
    .find(
      (r) =>
        String(r.defect_priority ?? '').toLowerCase() === 'high' ||
        String(r.defect_priority ?? '').toLowerCase() === 'critical',
    );

  if (crit) {
    const msg =
      crit.defect_description?.trim() ||
      crit.comment_text?.trim() ||
      'Критический дефект';
    criticalAlert = {
      id: `crit-${crit.id}`,
      message: `Критический дефект: ${msg}`,
      time: timeHm(crit.created_at),
      objectRef: crit.equipment_id ?? '',
    };
  } else if (defectsToday.length > 0) {
    const d = defectsToday.sort((a, b) => {
      const ta = a.created_at ? Date.parse(String(a.created_at)) : 0;
      const tb = b.created_at ? Date.parse(String(b.created_at)) : 0;
      return tb - ta;
    })[0];
    if (d) {
      const msg = d.defect_description?.trim() || d.comment_text?.trim() || 'Дефект';
      criticalAlert = {
        id: `crit-${d.id}`,
        message: `Дефект: ${msg}`,
        time: timeHm(d.created_at),
        objectRef: d.equipment_id ?? '',
      };
    }
  }

  return {
    shiftContext,
    metrics,
    employees,
    events,
    progress,
    criticalAlert,
  };
}

const ASSIGNMENT_SELECT =
  'id,task_id,worker_user_id,is_active,execution_status,last_progress_at,assigned_at,duration_minutes';

export async function fetchDashboardBundle(shift: ShiftInfo): Promise<DashboardFetchResult> {
  if (!isSupabaseConfigured()) {
    return { data: null, error: null };
  }
  const supabase = getSupabaseClient();
  const startISO = shift.startTime.toISOString();
  const endISO = shift.endTime.toISOString();
  const referenceMs = Math.min(Date.now(), shift.endTime.getTime());
  const shiftWindowStartMs = shift.startTime.getTime();
  const shiftWindowEndMs = shift.endTime.getTime();

  try {
    const [repRes, assignByAssignedAt, assignByProgress, workersRes] = await Promise.all([
      supabase
        .from('inspection_reports')
        .select('*')
        .gte('created_at', startISO)
        .lt('created_at', endISO)
        .order('created_at', { ascending: false })
        .limit(500),
      supabase
        .from('inspection_task_assignments')
        .select(ASSIGNMENT_SELECT)
        .eq('is_active', true)
        .gte('assigned_at', startISO)
        .lt('assigned_at', endISO)
        .limit(500),
      supabase
        .from('inspection_task_assignments')
        .select(ASSIGNMENT_SELECT)
        .eq('is_active', true)
        .gte('last_progress_at', startISO)
        .lt('last_progress_at', endISO)
        .limit(500),
      supabase.from('profiles').select('*').eq('role', 'worker').eq('is_active', true).limit(200),
    ]);

    const err =
      repRes.error?.message ||
      assignByAssignedAt.error?.message ||
      assignByProgress.error?.message ||
      workersRes.error?.message;
    if (err) {
      return { data: null, error: err };
    }

    const assignmentMap = new Map<string, InspectionTaskAssignmentRow>();
    for (const row of assignByAssignedAt.data ?? []) {
      const id = (row as { id?: string }).id;
      if (id) assignmentMap.set(id, row as InspectionTaskAssignmentRow);
    }
    for (const row of assignByProgress.data ?? []) {
      const id = (row as { id?: string }).id;
      if (id) assignmentMap.set(id, row as InspectionTaskAssignmentRow);
    }
    const assignments = [...assignmentMap.values()];

    const reports = (repRes.data ?? []) as InspectionReportRow[];
    const taskIds = new Set<string>();
    for (const r of reports) {
      if (r.task_id) taskIds.add(String(r.task_id));
    }
    for (const a of assignments) {
      if (a.task_id) taskIds.add(String(a.task_id));
    }

    let tasks: Array<{
      id: string;
      title?: string | null;
      status: string | null;
      shift_label?: string | null;
      site_name?: string | null;
      area_name?: string | null;
      created_at?: string | null;
    }> = [];
    let items: Array<{ id: string; task_id: string | null }> = [];

    if (taskIds.size > 0) {
      const ids = [...taskIds];
      const [tasksRes, itemsRes] = await Promise.all([
        supabase
          .from('inspection_tasks')
          .select('id,title,status,shift_label,site_name,area_name,created_at')
          .in('id', ids),
        supabase.from('inspection_task_items').select('id,task_id').in('task_id', ids).limit(5000),
      ]);
      if (tasksRes.error?.message || itemsRes.error?.message) {
        return {
          data: null,
          error: tasksRes.error?.message || itemsRes.error?.message || 'Ошибка загрузки заданий',
        };
      }
      tasks = (tasksRes.data ?? []) as typeof tasks;
      items = (itemsRes.data ?? []) as typeof items;
    }

    const bundle = buildDashboardBundle(
      {
        tasks,
        items,
        assignments,
        reports,
        workers: (workersRes.data ?? []) as ProfileRow[],
      },
      {
        referenceMs,
        shiftWindowStartMs,
        shiftWindowEndMs,
        shiftDisplay: {
          shiftNumber: String(shift.number),
          dateLabel: `${formatDateRu(shift.date)} г.`,
        },
      },
    );
    return { data: bundle, error: null };
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
