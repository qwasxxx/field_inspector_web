import {
  Alert,
  Box,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  fetchDefectReportsList,
  type DefectListRow,
} from '@/features/factory/services/defectsListApi';
import { defectPriorityRu } from '@/pages/ReportsPage/reportDisplay';
import { formatDateTime } from '@/shared/lib/formatDate';
import { isSupabaseConfigured } from '@/shared/lib/supabase/client';

export function DefectsPage() {
  const configured = isSupabaseConfigured();
  const [rows, setRows] = useState<DefectListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      setLoading(true);
      const { data, error: err } = await fetchDefectReportsList();
      if (cancelled) return;
      setRows(data);
      setError(err);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [configured]);

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
        Дефекты
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Отчёты, в которых обходчик отметил дефект. Подробности — в карточке отчёта.
      </Typography>

      {!configured ? (
        <Alert severity="warning">Подключение к серверу не настроено.</Alert>
      ) : null}
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      {loading ? (
        <CircularProgress size={28} />
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Дата</TableCell>
                <TableCell>Задание</TableCell>
                <TableCell>Оборудование</TableCell>
                <TableCell>Важность</TableCell>
                <TableCell>Кратко</TableCell>
                <TableCell align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Typography variant="body2" color="text.secondary">
                      Зафиксированных дефектов пока нет.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow key={r.id} hover>
                    <TableCell>{formatDateTime(r.created_at as string | undefined)}</TableCell>
                    <TableCell>{r.task_title ?? '—'}</TableCell>
                    <TableCell>{r.equipment_label ?? '—'}</TableCell>
                    <TableCell>{defectPriorityRu(r.defect_priority as string | null)}</TableCell>
                    <TableCell sx={{ maxWidth: 280 }}>
                      <Typography variant="body2" noWrap title={String(r.defect_description ?? '')}>
                        {r.defect_description ? String(r.defect_description) : '—'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <RouterLink to={`/reports/${r.id}`}>Отчёт</RouterLink>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
