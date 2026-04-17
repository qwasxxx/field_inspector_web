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
import { Download } from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';
import { useInspectionReports } from '@/features/factory/hooks/useInspectionReports';
import { defectPriorityRu } from '@/pages/ReportsPage/reportDisplay';
import { formatDateTime } from '@/shared/lib/formatDate';
import { isSupabaseConfigured } from '@/shared/lib/supabase/client';
import {
  exportOutlineButtonSx,
  exportToExcel,
  formatDateForFilename,
} from '@/utils/exportUtils';

export function ReportsListPage() {
  const { rows, loading, error } = useInspectionReports();
  const configured = isSupabaseConfigured();

  const handleExportExcel = () => {
    const exportRows = rows.map((r) => {
      const defectCol = r.defect_found ? 'Да' : 'Нет';
      const importance =
        r.defect_found === true
          ? defectPriorityRu(r.defect_priority as string | null)
          : '—';
      return [
        formatDateTime(r.created_at as string | undefined),
        r.task_title ?? '—',
        r.equipment_name ?? '—',
        r.equipment_code ?? '—',
        defectCol,
        importance,
        r.defect_description ? String(r.defect_description) : '—',
        r.photo_count ?? 0,
        r.audio_count ?? 0,
      ];
    });
    exportToExcel(
      [
        {
          name: 'Отчёты',
          headers: [
            'Дата',
            'Задание',
            'Оборудование',
            'Код',
            'Дефект',
            'Важность',
            'Описание',
            'Фото',
            'Аудио',
          ],
          rows: exportRows,
        },
      ],
      `reports_${formatDateForFilename()}.xlsx`,
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
          <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
            Отчёты
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Здесь отображаются отчёты, которые обходчики отправляют из мобильного приложения после
            выполнения задания: результаты проверок, показания, комментарии и отметки о дефектах.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Download size={16} style={{ marginRight: 6 }} />}
          onClick={handleExportExcel}
          disabled={loading}
          sx={exportOutlineButtonSx}
        >
          Экспорт Excel
        </Button>
      </Box>

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
              Недостаточно прав для просмотра отчётов. Обратитесь к администратору.
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
