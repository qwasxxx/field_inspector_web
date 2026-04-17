import type { EquipmentReadingRow } from '@/types/topology';

function toNum(v: unknown): number | null {
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  if (typeof v === 'string') {
    const n = parseFloat(v.replace(',', '.'));
    return Number.isNaN(n) ? null : n;
  }
  return null;
}

export function shortDateLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Точки для Recharts: одна строка показания — одна точка по времени. */
export function buildEquipmentChartPoints(
  rows: EquipmentReadingRow[],
  maxKeys = 4,
): { data: Record<string, string | number>[]; keys: string[] } {
  const keysSet = new Set<string>();
  for (const r of rows) {
    const vals = r.values;
    if (!vals || typeof vals !== 'object') continue;
    for (const [k, val] of Object.entries(vals)) {
      if (toNum(val) !== null) keysSet.add(k);
    }
  }
  const keys = [...keysSet].slice(0, maxKeys);
  const data = rows.map((r) => {
    const point: Record<string, string | number> = {
      label: shortDateLabel(r.recorded_at),
    };
    for (const k of keys) {
      const n = toNum(r.values?.[k]);
      point[k] = n ?? 0;
    }
    return point;
  });
  return { data, keys };
}
