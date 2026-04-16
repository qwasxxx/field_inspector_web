import { useCallback, useEffect, useState } from 'react';
import type { TaskDetailBundle } from '@/features/factory/services/inspectionTasksApi';
import { fetchTaskDetail } from '@/features/factory/services/inspectionTasksApi';

export function useTaskDetail(id: string | undefined) {
  const [bundle, setBundle] = useState<TaskDetailBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) {
      setBundle(null);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: err } = await fetchTaskDetail(id);
    setBundle(data);
    setError(err);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  return { bundle, loading, error, reload: load };
}
