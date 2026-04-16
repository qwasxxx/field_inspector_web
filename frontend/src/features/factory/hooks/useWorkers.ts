import { useCallback, useEffect, useState } from 'react';
import type { ProfileRow } from '@/entities/factory/model/types';
import { fetchWorkers } from '@/features/factory/services/workersApi';

export function useWorkers() {
  const [rows, setRows] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await fetchWorkers();
    setRows(data);
    setError(err);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { rows, loading, error, reload: load };
}
