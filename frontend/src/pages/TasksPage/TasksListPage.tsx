import {
  Alert,
  Box,
  Button,
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
import { Download } from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';
import { useInspectionTasks } from '@/features/factory/hooks/useInspectionTasks';
import { formatDateTime } from '@/shared/lib/formatDate';
import { isSupabaseConfigured } from '@/shared/lib/supabase/client';
import {
  exportOutlineButtonSx,
  exportToExcel,
  formatDateForFilename,
  STATUS_LABELS,
} from '@/utils/exportUtils';

export function TasksListPage() {
  const { rows, loading, error } = useInspectionTasks();
  const configured = isSupabaseConfigured();

  const handleExportExcel = () => {
    const exportRows = rows.map((r) => {
      const statusRaw = (r.status ?? '').trim();
      const statusRu = statusRaw ? STATUS_LABELS[statusRaw] ?? statusRaw : '—';
      const executor =
        r.assigned_worker?.full_name ?? r.assigned_worker?.username ?? '—';
      return [
        r.title ?? '—',
        r.site_name ?? '—',
        r.area_name ?? '—',
        statusRu,
        formatDateTime(r.due_at as string | undefined),
        executor,
        r.items_count != null ? String(r.items_count) : '—',
        r.execution_status ?? '—',
      ];
    });
    exportToExcel(
      [
        {
          name: 'Задания',
          headers: [
            'Название',
            'Площадка',
            'Участок',
            'Статус',
            'Срок',
            'Исполнитель',
            'Позиций',
            'Выполнение',
          ],
          rows: exportRows,
        },
      ],
      `tasks_${formatDateForFilename()}.xlsx`,
    );
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 2,
          mb: 2,
        }}
      >
        <Box>
          <Typography variant="h4" component="h1" sx={{ mb: 1 }}>
            Задания на обход
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Новое задание создаётся в разделе{' '}
            <Link component={RouterLink} to="/objects">
              Объекты
            </Link>
            : выберите оборудование, затем «Назначить обход».
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Download size={16} style={{ marginRight: 6 }} />}
          onClick={handleExportExcel}
          disabled={loading}
          sx={exportOutlineButtonSx}
        >
          ⬇ Экспорт Excel
        </Button>
      </Box>

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
