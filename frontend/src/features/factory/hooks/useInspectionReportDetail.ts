import { useCallback, useEffect, useState } from 'react';
import {
  fetchInspectionReportDetail,
  type ReportDetailBundle,
} from '@/features/factory/services/inspectionReportsApi';

export function useInspectionReportDetail(id: string | undefined) {
  const [bundle, setBundle] = useState<ReportDetailBundle | null>(null);
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
    const { data, error: err } = await fetchInspectionReportDetail(id);
    setBundle(!err && data.report ? data : null);
    setError(err);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  return { bundle, loading, error, reload: load };
}
