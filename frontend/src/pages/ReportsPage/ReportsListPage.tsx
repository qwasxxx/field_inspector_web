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
import { useInspectionReports } from '@/features/factory/hooks/useInspectionReports';
import { defectPriorityRu } from '@/pages/ReportsPage/reportDisplay';
import { formatDateTime } from '@/shared/lib/formatDate';
import { isSupabaseConfigured } from '@/shared/lib/supabase/client';

export function ReportsListPage() {
  const { rows, loading, error } = useInspectionReports();
  const configured = isSupabaseConfigured();

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
        Отчёты
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Здесь отображаются отчёты, которые обходчики отправляют из мобильного приложения после
        выполнения задания: результаты проверок, показания, комментарии и отметки о дефектах.
      </Typography>

      {!configured ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Подключение к серверу не настроено.
        </Alert>
      ) : null}
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="body2">{error}</Typography>
          {error.includes('permission') || error.includes('RLS') || error.includes('policy') ? (
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
              Нужны права на чтение отчётов у роли администратора в базе данных.
            </Typography>
          ) : null}
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
                <TableCell>Дефект</TableCell>
                <TableCell align="right">Фото и аудио</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Typography variant="body2" color="text.secondary">
                      Нет отчётов. После выполнения задания в приложении данные появятся здесь.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow key={r.id} hover>
                    <TableCell>{formatDateTime(r.created_at as string | undefined)}</TableCell>
                    <TableCell>{r.task_title ?? '—'}</TableCell>
                    <TableCell>
                      {r.equipment_name ?? '—'}
                      {r.equipment_code ? (
                        <Typography variant="caption" color="text.secondary" display="block">
                          {r.equipment_code}
                        </Typography>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      {r.defect_found ? (
                        <Typography color="warning.main" variant="body2">
                          Да ({defectPriorityRu(r.defect_priority as string | null)})
                        </Typography>
                      ) : (
                        'Нет'
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {r.photo_count ?? 0} / {r.audio_count ?? 0}
                    </TableCell>
                    <TableCell align="right">
                      <RouterLink to={`/reports/${r.id}`}>Открыть</RouterLink>
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
