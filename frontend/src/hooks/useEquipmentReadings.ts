import { useCallback, useEffect, useState } from 'react';
import { getSupabaseClient, isSupabaseConfigured } from '@/shared/lib/supabase/client';
import type { EquipmentReadingRow } from '@/types/topology';

export async function fetchLatestReading(
  equipmentId: string,
): Promise<EquipmentReadingRow | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('equipment_readings')
    .select('*')
    .eq('equipment_id', equipmentId)
    .order('recorded_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return data as EquipmentReadingRow;
}

export async function fetchLatestReadingsMap(
  equipmentIds: string[],
): Promise<Map<string, EquipmentReadingRow>> {
  const map = new Map<string, EquipmentReadingRow>();
  if (!isSupabaseConfigured() || equipmentIds.length === 0) return map;
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('equipment_readings')
    .select('*')
    .in('equipment_id', equipmentIds)
    .order('recorded_at', { ascending: false });
  if (error || !data) return map;
  for (const row of data as EquipmentReadingRow[]) {
    if (!map.has(row.equipment_id)) {
      map.set(row.equipment_id, row);
    }
  }
  return map;
}

/** Сводка для карточки оборудования на странице «Объекты». */
export type EquipmentModalStats = {
  lastReadingAt: string | null;
  lastInspectionAt: string | null;
  lastHasDeviation: boolean;
  readingsInPeriod: number;
  inspectionsInPeriod: number;
  periodDays: 7 | 30;
};

function emptyModalStats(periodDays: 7 | 30 = 7): EquipmentModalStats {
  return {
    lastReadingAt: null,
    lastInspectionAt: null,
    lastHasDeviation: false,
    readingsInPeriod: 0,
    inspectionsInPeriod: 0,
    periodDays,
  };
}

export async function fetchEquipmentModalStats(
  equipmentId: string,
  periodDays: 7 | 30 = 7,
): Promise<EquipmentModalStats> {
  if (!isSupabaseConfigured()) return emptyModalStats(periodDays);
  const supabase = getSupabaseClient();
  const from = new Date(
    Date.now() - periodDays * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data: latest, error: e1 } = await supabase
    .from('equipment_readings')
    .select('recorded_at, source, has_deviation')
    .eq('equipment_id', equipmentId)
    .order('recorded_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (e1) return emptyModalStats(periodDays);

  const { data: lastInsp } = await supabase
    .from('equipment_readings')
    .select('recorded_at')
    .eq('equipment_id', equipmentId)
    .eq('source', 'inspection')
    .order('recorded_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { count: readingsInPeriod } = await supabase
    .from('equipment_readings')
    .select('id', { count: 'exact', head: true })
    .eq('equipment_id', equipmentId)
    .gte('recorded_at', from);

  const { count: inspectionsInPeriod } = await supabase
    .from('equipment_readings')
    .select('id', { count: 'exact', head: true })
    .eq('equipment_id', equipmentId)
    .eq('source', 'inspection')
    .gte('recorded_at', from);

  const row = latest as { recorded_at: string; has_deviation: boolean } | null;

  return {
    lastReadingAt: row?.recorded_at ?? null,
    lastInspectionAt: (lastInsp as { recorded_at: string } | null)?.recorded_at ?? null,
    lastHasDeviation: row?.has_deviation ?? false,
    readingsInPeriod: readingsInPeriod ?? 0,
    inspectionsInPeriod: inspectionsInPeriod ?? 0,
    periodDays,
  };
}

export async function fetchReadingsInRange(
  equipmentId: string,
  fromIso: string,
  toIso: string,
): Promise<EquipmentReadingRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('equipment_readings')
    .select('*')
    .eq('equipment_id', equipmentId)
    .gte('recorded_at', fromIso)
    .lte('recorded_at', toIso)
    .order('recorded_at', { ascending: true });
  if (error || !data) return [];
  return data as EquipmentReadingRow[];
}

export function useReadingsRange(
  equipmentId: string | null,
  fromIso: string | null,
  toIso: string | null,
) {
  const [data, setData] = useState<EquipmentReadingRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!equipmentId || !fromIso || !toIso) {
      setData([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchReadingsInRange(equipmentId, fromIso, toIso);
      setData(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [equipmentId, fromIso, toIso]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, error, loading, reload: load };
}
