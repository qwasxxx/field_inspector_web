import { useCallback, useEffect, useState } from 'react';
import type { TaskWithExtras } from '@/features/factory/services/inspectionTasksApi';
import { fetchInspectionTasks } from '@/features/factory/services/inspectionTasksApi';

export function useInspectionTasks() {
  const [rows, setRows] = useState<TaskWithExtras[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await fetchInspectionTasks();
    setRows(data);
    setError(err);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { rows, loading, error, reload: load };
}
