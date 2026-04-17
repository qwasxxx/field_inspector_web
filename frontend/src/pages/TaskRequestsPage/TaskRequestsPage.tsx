import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import {
  Alert,
  Box,
  Button,
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
import { useTaskRequests } from '@/features/factory/hooks/useTaskRequests';
import { formatDateTime } from '@/shared/lib/formatDate';
import { isSupabaseConfigured } from '@/shared/lib/supabase/client';

export function TaskRequestsPage() {
  const { rows, loading, error, approve, reject, actionLoading } = useTaskRequests();
  const configured = isSupabaseConfigured();

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Заявки на задания
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Таблица: <code>inspection_task_requests</code>. Одобрение / отклонение без падения UI при
        отсутствии API.
      </Typography>

      {!configured ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Supabase не настроен — действия логируются в консоль.
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
                <TableCell>Заявитель</TableCell>
                <TableCell>Логин / код</TableCell>
                <TableCell>Площадка</TableCell>
                <TableCell>Участок</TableCell>
                <TableCell>Описание</TableCell>
                <TableCell>Приоритет</TableCell>
                <TableCell>Статус</TableCell>
                <TableCell>Создано</TableCell>
                <TableCell align="right">Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10}>
                    {configured
                      ? 'Нет заявок или таблица inspection_task_requests недоступна.'
                      : '—'}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r, idx) => {
                  const id = String(r.id ?? '');
                  const busy = actionLoading === id;
                  const req = r.requester_profile;
                  return (
                    <TableRow key={r.id != null ? String(r.id) : `tr-${idx}`}>
                      <TableCell>{r.title ?? '—'}</TableCell>
                      <TableCell>{req?.full_name ?? req?.username ?? r.requested_by ?? '—'}</TableCell>
                      <TableCell>
                        {req?.username ?? '—'} / {req?.employee_code ?? '—'}
                      </TableCell>
                      <TableCell>{r.site_name ?? '—'}</TableCell>
                      <TableCell>{r.area_name ?? '—'}</TableCell>
                      <TableCell sx={{ maxWidth: 200 }}>{r.description ?? '—'}</TableCell>
                      <TableCell>{r.priority ?? '—'}</TableCell>
                      <TableCell>{r.status ?? '—'}</TableCell>
                      <TableCell>{formatDateTime(r.requested_at as string | undefined)}</TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          color="success"
                          startIcon={busy ? <CircularProgress size={14} /> : <CheckRoundedIcon />}
                          disabled={busy}
                          onClick={() => void approve(id)}
                        >
                          Принять
                        </Button>
                        <Button
                          size="small"
                          color="inherit"
                          startIcon={<CloseRoundedIcon />}
                          disabled={busy}
                          onClick={() => void reject(id)}
                          sx={{ ml: 1 }}
                        >
                          Отклонить
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
