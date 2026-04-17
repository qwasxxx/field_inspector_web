import { useCallback, useEffect, useState } from 'react';
import {
  fetchInspectionReportsList,
  type ReportListRow,
} from '@/features/factory/services/inspectionReportsApi';

export function useInspectionReports() {
  const [rows, setRows] = useState<ReportListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await fetchInspectionReportsList();
    setRows(data);
    setError(err);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { rows, loading, error, reload: load };
}
