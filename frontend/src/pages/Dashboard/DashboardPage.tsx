import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { Download } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type {
  CriticalDefectAlert,
  DashboardEmployee,
  DashboardMetric,
  ShiftContext,
  ShiftEvent,
  ShiftProgressItem,
} from '@/entities/dashboard/model/types';
import {
  emptyDashboardBundle,
  fetchDashboardBundle,
} from '@/features/factory/services/dashboardAdminApi';
import { isSupabaseConfigured } from '@/shared/lib/supabase/client';
import {
  exportIconButtonSx,
  exportToExcel,
  formatDateForFilename,
  sanitizeFilenamePart,
} from '@/utils/exportUtils';
import { DashboardCriticalAlert } from './components/DashboardCriticalAlert';
import { DashboardEmployeesColumn } from './components/DashboardEmployeesColumn';
import { DashboardMetricCards } from './components/DashboardMetricCards';
import { DashboardObjectProgress } from './components/DashboardObjectProgress';
import { DashboardShiftEvents } from './components/DashboardShiftEvents';
import styles from './DashboardPage.module.scss';

export function DashboardPage() {
  const navigate = useNavigate();
  const configured = isSupabaseConfigured();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [ctx, setCtx] = useState<ShiftContext>(() => emptyDashboardBundle().shiftContext);
  const [criticalAlert, setCriticalAlert] = useState<CriticalDefectAlert | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetric[]>(() => emptyDashboardBundle().metrics);
  const [employees, setEmployees] = useState<DashboardEmployee[]>([]);
  const [events, setEvents] = useState<ShiftEvent[]>([]);
  const [progress, setProgress] = useState<ShiftProgressItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!configured) {
        const empty = emptyDashboardBundle();
        setCtx(empty.shiftContext);
        setCriticalAlert(null);
        setMetrics(empty.metrics);
        setEmployees(empty.employees);
        setEvents(empty.events);
        setProgress(empty.progress);
        setLoading(false);
        return;
      }
      setLoading(true);
      setLoadError(null);
      const { data, error } = await fetchDashboardBundle();
      if (cancelled) return;
      if (error) {
        setLoadError(error);
        const empty = emptyDashboardBundle();
        setCtx(empty.shiftContext);
        setCriticalAlert(null);
        setMetrics(empty.metrics);
        setEmployees(empty.employees);
        setEvents(empty.events);
        setProgress(empty.progress);
      } else if (data) {
        setCtx(data.shiftContext);
        setCriticalAlert(data.criticalAlert);
        setMetrics(data.metrics);
        setEmployees(data.employees);
        setEvents(data.events);
        setProgress(data.progress);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [configured]);

  const handleExportExcel = () => {
    const mVal = (id: string) => metrics.find((m) => m.id === id)?.value ?? '—';
    const shiftSheet: (string | number)[][] = [
      ['Смена', ctx.shiftNumber],
      ['Дата', new Date().toLocaleDateString('ru-RU')],
      ['Выполнено объектов', mVal('m1')],
      ['Активных обходчиков', mVal('m2')],
      ['Дефектов за смену', mVal('m3')],
      ['Среднее время на объект', mVal('m4')],
    ];
    const empRows = employees.map((e) => [e.name, e.locationHint, e.statusLabel]);
    const evRows = events.map((ev) => [ev.time, ev.title, ev.detail]);
    const shiftFn = sanitizeFilenamePart(ctx.shiftNumber);
    exportToExcel(
      [
        {
          name: 'Смена',
          headers: ['Показатель', 'Значение'],
          rows: shiftSheet,
        },
        {
          name: 'Сотрудники',
          headers: ['ФИО', 'Задание', 'Статус'],
          rows: empRows,
        },
        {
          name: 'События',
          headers: ['Время', 'Событие', 'Описание'],
          rows: evRows,
        },
      ],
      `dashboard_shift_${shiftFn}_${formatDateForFilename()}.xlsx`,
    );
  };

  return (
    <Stack spacing={3} className={styles.wrap} sx={{ width: '100%' }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-start', sm: 'flex-start' }}
        justifyContent="space-between"
        spacing={2}
      >
        <Box>
          <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" sx={{ mb: 1 }}>
            <Typography variant="h4" component="h1" fontWeight={700}>
              Дашборд — Смена №{ctx.shiftNumber}
            </Typography>
            <Tooltip title="Экспорт Excel">
              <IconButton
                size="small"
                onClick={handleExportExcel}
                disabled={loading}
                aria-label="Экспорт Excel"
                sx={exportIconButtonSx}
              >
                <Download size={16} />
              </IconButton>
            </Tooltip>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {ctx.dateLabel} • {ctx.siteLabel}
          </Typography>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
            <Chip
              size="small"
              color="success"
              label={`Онлайн: ${ctx.onlineCurrent} из ${ctx.onlineTotal}`}
            />
            {loading ? <CircularProgress size={18} /> : null}
          </Stack>
        </Box>
      </Stack>

      {!configured ? (
        <Alert severity="warning">
          Задайте VITE_SUPABASE_URL и VITE_SUPABASE_PUBLISHABLE_KEY в frontend/.env.local — иначе дашборд
          без данных из базы.
        </Alert>
      ) : null}
      {loadError ? (
        <Alert severity="error">
          Не удалось загрузить дашборд: {loadError}
        </Alert>
      ) : null}

      {criticalAlert ? (
        <DashboardCriticalAlert
          alert={criticalAlert}
          onView={() => navigate('/defects')}
        />
      ) : null}

      <DashboardMetricCards metrics={metrics} />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
          gap: 2,
          alignItems: 'stretch',
        }}
      >
        <DashboardEmployeesColumn employees={employees} />
        <DashboardShiftEvents events={events} />
      </Box>
      <DashboardObjectProgress items={progress} />
    </Stack>
  );
}
