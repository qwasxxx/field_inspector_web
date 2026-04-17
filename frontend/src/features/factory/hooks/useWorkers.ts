import { useCallback, useEffect, useState } from 'react';
import type { ProfileRow } from '@/entities/factory/model/types';
import {
  fetchWorkers,
  type FetchWorkersOptions,
} from '@/features/factory/services/workersApi';

export function useWorkers(options?: FetchWorkersOptions) {
  const onlyActive = options?.onlyActive !== false;

  const [rows, setRows] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await fetchWorkers({ onlyActive });
    setRows(data);
    setError(err);
    setLoading(false);
  }, [onlyActive]);

  useEffect(() => {
    void load();
  }, [load]);

  return { rows, loading, error, reload: load };
}
