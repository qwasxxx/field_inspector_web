import { useCallback, useEffect, useState } from 'react';
import { getSupabaseClient, isSupabaseConfigured } from '@/shared/lib/supabase/client';
import type { EquipmentConnectionRow, EquipmentNodeRow } from '@/types/topology';

type Result<T> = {
  data: T;
  error: string | null;
  loading: boolean;
  reload: () => Promise<void>;
};

export function useChildrenNodes(parentId: string | null): Result<EquipmentNodeRow[]> {
  const [data, setData] = useState<EquipmentNodeRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setData([]);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const supabase = getSupabaseClient();
      let q = supabase
        .from('equipment_nodes')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (parentId === null) {
        q = q.is('parent_id', null);
      } else {
        q = q.eq('parent_id', parentId);
      }
      const { data: rows, error: err } = await q;
      if (err) {
        setError(err.message);
        setData([]);
      } else {
        setData((rows ?? []) as EquipmentNodeRow[]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [parentId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, error, loading, reload: load };
}

/** Все активные узлы иерархии (для списка «Объекты», построение дерева на клиенте). */
export async function fetchAllActiveEquipmentNodes(): Promise<EquipmentNodeRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('equipment_nodes')
    .select('*')
    .eq('is_active', true)
    .order('name');
  if (error || !data) return [];
  return data as EquipmentNodeRow[];
}

export async function fetchNodeById(id: string): Promise<EquipmentNodeRow | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('equipment_nodes')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error || !data) return null;
  return data as EquipmentNodeRow;
}

export async function fetchAncestorChain(nodeId: string): Promise<EquipmentNodeRow[]> {
  const chain: EquipmentNodeRow[] = [];
  let currentId: string | null = nodeId;
  const guard = 20;
  let steps = 0;
  while (currentId && steps < guard) {
    const node = await fetchNodeById(currentId);
    if (!node) break;
    chain.unshift(node);
    currentId = node.parent_id;
    steps += 1;
  }
  return chain;
}

export function useConnections(workshopId: string | null): Result<EquipmentConnectionRow[]> {
  const [data, setData] = useState<EquipmentConnectionRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured() || !workshopId) {
      setData([]);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const supabase = getSupabaseClient();
      const { data: rows, error: err } = await supabase
        .from('equipment_connections')
        .select('*')
        .eq('workshop_id', workshopId);
      if (err) {
        setError(err.message);
        setData([]);
      } else {
        setData((rows ?? []) as EquipmentConnectionRow[]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [workshopId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, error, loading, reload: load };
}

export async function updateNodePosition(
  id: string,
  posX: number,
  posY: number,
): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured()) return { error: 'Supabase не настроен' };
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('equipment_nodes')
    .update({ pos_x: posX, pos_y: posY, updated_at: new Date().toISOString() })
    .eq('id', id);
  return { error: error ? error.message : null };
}

export async function countEquipmentNodes(): Promise<number | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = getSupabaseClient();
  const { count, error } = await supabase
    .from('equipment_nodes')
    .select('id', { count: 'exact', head: true });
  if (error) return null;
  return count ?? 0;
}
