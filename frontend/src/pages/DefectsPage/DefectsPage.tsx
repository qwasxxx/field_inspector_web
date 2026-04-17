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
import { useEffect, useState } from 'react';
import {
  fetchDefectReportsList,
  type DefectListRow,
} from '@/features/factory/services/defectsListApi';
import { defectPriorityRu } from '@/pages/ReportsPage/reportDisplay';
import { formatDateTime } from '@/shared/lib/formatDate';
import { isSupabaseConfigured } from '@/shared/lib/supabase/client';
import {
  exportOutlineButtonSx,
  exportToExcel,
  formatDateForFilename,
  PRIORITY_LABELS,
} from '@/utils/exportUtils';

function splitEquipmentLabel(equipmentLabel: string | null | undefined): {
  name: string;
  code: string;
} {
  const label = (equipmentLabel ?? '').trim();
  if (!label) return { name: '—', code: '—' };
  const parts = label.split(' · ').map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return { name: parts[0], code: parts.slice(1).join(' · ') };
  }
  return { name: parts[0], code: '—' };
}

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

  const handleExportExcel = () => {
    const exportRows = rows.map((r) => {
      const { name, code } = splitEquipmentLabel(r.equipment_label);
      const pr = (r.defect_priority as string | null | undefined)?.toLowerCase() ?? '';
      const priorityRu = pr ? PRIORITY_LABELS[pr] ?? defectPriorityRu(r.defect_priority as string | null) : '—';
      return [
        formatDateTime(r.created_at as string | undefined),
        r.task_title ?? '—',
        name,
        code,
        priorityRu,
        r.defect_description ? String(r.defect_description) : '—',
      ];
    });
    exportToExcel(
      [
        {
          name: 'Дефекты',
          headers: [
            'Дата',
            'Задание',
            'Оборудование',
            'Код оборудования',
            'Важность',
            'Описание дефекта',
          ],
          rows: exportRows,
        },
      ],
      `defects_${formatDateForFilename()}.xlsx`,
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
            Дефекты
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Отчёты, в которых обходчик отметил дефект. Подробности — в карточке отчёта.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Download size={16} style={{ marginRight: 6 }} />}
          onClick={handleExportExcel}
          disabled={loading || !configured}
          sx={exportOutlineButtonSx}
        >
          Экспорт Excel
        </Button>
      </Box>

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
