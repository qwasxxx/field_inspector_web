import {
  Alert,
  Box,
  CircularProgress,
  Link,
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
import { useInspectionTasks } from '@/features/factory/hooks/useInspectionTasks';
import { formatDateTime } from '@/shared/lib/formatDate';
import { isSupabaseConfigured } from '@/shared/lib/supabase/client';

export function TasksListPage() {
  const { rows, loading, error } = useInspectionTasks();
  const configured = isSupabaseConfigured();

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" component="h1" sx={{ mb: 1 }}>
        Задания на обход
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Новое задание создаётся в разделе{' '}
        <Link component={RouterLink} to="/objects">
          Объекты
        </Link>
        : выберите оборудование, затем «Назначить обход».
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
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Название</TableCell>
                <TableCell>Площадка</TableCell>
                <TableCell>Участок</TableCell>
                <TableCell>Статус</TableCell>
                <TableCell>Срок</TableCell>
                <TableCell>Исполнитель</TableCell>
                <TableCell>Позиций</TableCell>
                <TableCell>Мин.</TableCell>
                <TableCell>Выполнение</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9}>
                    {configured ? 'Нет заданий или таблица недоступна.' : '—'}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r, idx) => (
                  <TableRow key={r.id != null ? String(r.id) : `t-${idx}`} hover>
                    <TableCell>
                      {r.id ? (
                        <Link component={RouterLink} to={`/tasks/${r.id}`} underline="hover">
                          {r.title ?? '—'}
                        </Link>
                      ) : (
                        (r.title ?? '—')
                      )}
                    </TableCell>
                    <TableCell>{r.site_name ?? '—'}</TableCell>
                    <TableCell>{r.area_name ?? '—'}</TableCell>
                    <TableCell>{r.status ?? '—'}</TableCell>
                    <TableCell>{formatDateTime(r.due_at as string | undefined)}</TableCell>
                    <TableCell>
                      {r.assigned_worker?.full_name ??
                        r.assigned_worker?.username ??
                        '—'}
                    </TableCell>
                    <TableCell>
                      {r.items_count != null ? String(r.items_count) : '—'}
                    </TableCell>
                    <TableCell>
                      {r.duration_minutes != null ? String(r.duration_minutes) : '—'}
                    </TableCell>
                    <TableCell>{r.execution_status ?? '—'}</TableCell>
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
