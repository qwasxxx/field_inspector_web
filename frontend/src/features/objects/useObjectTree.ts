import { useCallback, useEffect, useState } from 'react';
import { buildObjectTreeFromRows } from '@/features/objects/buildObjectTree';
import type { ObjectNode } from '@/features/objects/types';
import { fetchAllActiveEquipmentNodes } from '@/hooks/useTopologyNodes';
import { isSupabaseConfigured } from '@/shared/lib/supabase/client';

export function useObjectTree() {
  const [tree, setTree] = useState<ObjectNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setTree([]);
      setError('Supabase не настроен (проверьте .env).');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchAllActiveEquipmentNodes();
      setTree(buildObjectTreeFromRows(rows));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setTree([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { tree, loading, error, reload: load };
}
