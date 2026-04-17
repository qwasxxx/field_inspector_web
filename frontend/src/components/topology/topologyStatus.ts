import type { EquipmentNodeRow, EquipmentReadingRow, ReadingStatusTone } from '@/types/topology';

export function toneFromReading(
  reading: EquipmentReadingRow | undefined,
  norms: EquipmentNodeRow['param_norms'],
): ReadingStatusTone {
  if (!reading) return 'none';
  if (reading.has_deviation) return 'critical';
  for (const [key, raw] of Object.entries(reading.values)) {
    if (typeof raw !== 'number') continue;
    const n = norms[key];
    if (n && (raw < n.min || raw > n.max)) return 'minor';
  }
  return 'ok';
}
