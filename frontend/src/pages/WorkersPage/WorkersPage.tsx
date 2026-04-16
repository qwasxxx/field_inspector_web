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
import { useWorkers } from '@/features/factory/hooks/useWorkers';
import { isSupabaseConfigured } from '@/shared/lib/supabase/client';

export function WorkersPage() {
  const { rows, loading, error } = useWorkers();
  const configured = isSupabaseConfigured();

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Обходчики
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Список профилей с ролью <code>worker</code> (только просмотр). Таблица:{' '}
        <code>profiles</code>.
      </Typography>

      {!configured ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Supabase не настроен — данные не загрузятся.
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
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>ФИО</TableCell>
                <TableCell>Логин</TableCell>
                <TableCell>Код сотрудника</TableCell>
                <TableCell>Роль</TableCell>
                <TableCell>Активен</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    {configured ? 'Нет данных или таблица недоступна.' : '—'}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r, idx) => (
                  <TableRow key={r.id != null ? String(r.id) : `w-${idx}`}>
                    <TableCell>{r.full_name ?? '—'}</TableCell>
                    <TableCell>{r.username ?? '—'}</TableCell>
                    <TableCell>{r.employee_code ?? '—'}</TableCell>
                    <TableCell>{r.role ?? '—'}</TableCell>
                    <TableCell>{r.is_active === true ? 'Да' : r.is_active === false ? 'Нет' : '—'}</TableCell>
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
