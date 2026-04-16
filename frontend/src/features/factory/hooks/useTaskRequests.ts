import { useCallback, useEffect, useState } from 'react';
import type { TaskRequestWithProfile } from '@/features/factory/services/taskRequestsApi';
import {
  approveTaskRequest,
  fetchTaskRequests,
  rejectTaskRequest,
} from '@/features/factory/services/taskRequestsApi';

export function useTaskRequests() {
  const [rows, setRows] = useState<TaskRequestWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await fetchTaskRequests();
    setRows(data);
    setError(err);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const approve = useCallback(
    async (id: string) => {
      setActionLoading(id);
      try {
        await approveTaskRequest(id);
        await load();
      } finally {
        setActionLoading(null);
      }
    },
    [load],
  );

  const reject = useCallback(
    async (id: string) => {
      setActionLoading(id);
      try {
        await rejectTaskRequest(id);
        await load();
      } finally {
        setActionLoading(null);
      }
    },
    [load],
  );

  return { rows, loading, error, reload: load, approve, reject, actionLoading };
}
