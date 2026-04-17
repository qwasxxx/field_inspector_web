const MS_PER_SHIFT = 8 * 60 * 60 * 1000;

/** Первая смена в системе: 01.01.2025 06:00 (локальное время). */
export const SHIFT_EPOCH = new Date(2025, 0, 1, 6, 0, 0, 0);

const SHIFT_NAMES = ['Первая смена', 'Вторая смена', 'Третья смена'] as const;

const SHIFT_TIMES = [
  { start: 6, end: 14 },
  { start: 14, end: 22 },
  { start: 22, end: 6, nextDay: true },
] as const;

export interface ShiftInfo {
  number: number;
  label: string;
  date: Date;
  shiftOfDay: 1 | 2 | 3;
  shiftName: string;
  startTime: Date;
  endTime: Date;
  timeRange: string;
}

/** Календарный день (полночь) в локальной TZ. */
function startOfLocalDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function buildTimeRange(shiftOfDay: 1 | 2 | 3): string {
  if (shiftOfDay === 1) return '06:00 – 14:00';
  if (shiftOfDay === 2) return '14:00 – 22:00';
  return '22:00 – 06:00';
}

/**
 * date — календарный день начала смены (для 3-й ночной смены — день, когда она стартует в 22:00).
 */
export function buildShiftInfo(date: Date, shiftOfDay: 1 | 2 | 3): ShiftInfo {
  const d = startOfLocalDay(date);
  let startTime: Date;
  let endTime: Date;

  if (shiftOfDay === 3) {
    startTime = new Date(d);
    startTime.setHours(22, 0, 0, 0);
    endTime = new Date(d);
    endTime.setDate(endTime.getDate() + 1);
    endTime.setHours(6, 0, 0, 0);
  } else {
    const t = SHIFT_TIMES[shiftOfDay - 1];
    startTime = new Date(d);
    startTime.setHours(t.start, 0, 0, 0);
    endTime = new Date(d);
    endTime.setHours(t.end, 0, 0, 0);
  }

  const diffMs = startTime.getTime() - SHIFT_EPOCH.getTime();
  const number = Math.floor(diffMs / MS_PER_SHIFT) + 1;

  return {
    number,
    label: `Смена №${number}`,
    date: d,
    shiftOfDay,
    shiftName: SHIFT_NAMES[shiftOfDay - 1],
    startTime,
    endTime,
    timeRange: buildTimeRange(shiftOfDay),
  };
}

/** Текущая смена по локальному времени (ночная 22–06 относится к дню старта в 22:00). */
export function getCurrentShift(): ShiftInfo {
  const now = new Date();
  const hour = now.getHours();
  if (hour >= 6 && hour < 14) return buildShiftInfo(now, 1);
  if (hour >= 14 && hour < 22) return buildShiftInfo(now, 2);
  if (hour >= 22) return buildShiftInfo(now, 3);
  const y = new Date(now);
  y.setDate(y.getDate() - 1);
  return buildShiftInfo(y, 3);
}

export function getShiftByNumber(num: number): ShiftInfo {
  if (!Number.isFinite(num) || num < 1) {
    throw new Error(`Invalid shift number: ${num}`);
  }
  const startMs = SHIFT_EPOCH.getTime() + (num - 1) * MS_PER_SHIFT;
  const startTime = new Date(startMs);
  const h = startTime.getHours();
  const d = startOfLocalDay(startTime);
  if (h === 6) return buildShiftInfo(d, 1);
  if (h === 14) return buildShiftInfo(d, 2);
  if (h === 22) return buildShiftInfo(d, 3);
  if (h === 0 || (h < 6 && h >= 0)) {
    const prev = new Date(startTime);
    prev.setDate(prev.getDate() - 1);
    return buildShiftInfo(prev, 3);
  }
  return buildShiftInfo(d, 1);
}

export function getShiftsForDate(date: Date): ShiftInfo[] {
  return [1, 2, 3].map((s) => buildShiftInfo(date, s as 1 | 2 | 3));
}

export function formatDateRu(date: Date): string {
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Смена активна «сейчас» (текущее время внутри [start, end)). */
export function isCurrentShift(shift: ShiftInfo): boolean {
  const now = new Date();
  return now >= shift.startTime && now < shift.endTime;
}

/** Парсинг YYYY-MM-DD в локальную дату (полдень, чтобы избежать сдвига TZ). */
export function parseIsoDateLocal(iso: string): Date {
  const [y, m, day] = iso.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, day ?? 1, 12, 0, 0, 0);
}
