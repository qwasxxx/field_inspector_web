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
import { Link as RouterLink, useParams } from 'react-router-dom';
import { useTaskDetail } from '@/features/factory/hooks/useTaskDetail';
import { formatDateTime } from '@/shared/lib/formatDate';
import { isSupabaseConfigured } from '@/shared/lib/supabase/client';

export function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { bundle, loading, error } = useTaskDetail(id);
  const configured = isSupabaseConfigured();
  const t = bundle?.task;
  const routeItems = bundle?.items ?? [];
  const hasRouteItems = routeItems.length > 0;

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Задание
      </Typography>
      <Typography variant="body2" sx={{ mb: 2 }}>
        <RouterLink to="/tasks">← К списку заданий</RouterLink>
      </Typography>

      {!configured ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Supabase не настроен.
        </Alert>
      ) : null}
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      {loading ? (
        <CircularProgress size={28} />
      ) : !t ? (
        <Typography color="text.secondary">Нет данных.</Typography>
      ) : (
        <>
          <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Название
            </Typography>
            <Typography variant="body1" gutterBottom>
              {t.title ?? '—'}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              Площадка / участок
            </Typography>
            <Typography variant="body1" gutterBottom>
              {t.site_name ?? '—'} / {t.area_name ?? '—'}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              Статус
            </Typography>
            <Typography variant="body1" gutterBottom>
              {t.status ?? '—'}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              Срок
            </Typography>
            <Typography variant="body1" gutterBottom>
              {formatDateTime(t.due_at as string | undefined)}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              Исполнитель
            </Typography>
            <Typography variant="body1" gutterBottom>
              {bundle?.worker?.full_name ?? bundle?.worker?.username ?? '—'}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              Начало / окончание / длительность (мин.)
            </Typography>
            <Typography variant="body1" gutterBottom>
              {formatDateTime(t.started_at as string | undefined)} /{' '}
              {formatDateTime(t.completed_at as string | undefined)} /{' '}
              {t.duration_minutes != null ? String(t.duration_minutes) : '—'}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              Статус выполнения
            </Typography>
            <Typography variant="body1">{t.execution_status ?? '—'}</Typography>
          </Paper>

          <Typography variant="h6" gutterBottom>
            Позиции оборудования
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Оборудование</TableCell>
                  <TableCell>Место</TableCell>
                  <TableCell>Код</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {hasRouteItems ? (
                  routeItems.map((it, idx) => (
                    <TableRow key={it.id != null ? String(it.id) : `i-${idx}`}>
                      <TableCell>{it.equipment_name ?? '—'}</TableCell>
                      <TableCell>{it.equipment_location ?? '—'}</TableCell>
                      <TableCell>{it.equipment_code ?? '—'}</TableCell>
                    </TableRow>
                  ))
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={3}>
                      Позиции маршрута не загружены — см. сообщение об ошибке выше.
                    </TableCell>
                  </TableRow>
                ) : (
                  <TableRow>
                    <TableCell colSpan={3}>
                      В задании нет позиций оборудования (маршрут не был сохранён).
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
}
