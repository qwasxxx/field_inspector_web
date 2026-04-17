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
import { useCallback, useEffect, useState } from 'react';
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
import {
  fetchOpenCriticalRedAlertsCount,
  subscribeEquipmentRedAlertsRealtime,
} from '@/features/factory/services/equipmentRedAlertsApi';
import { isSupabaseConfigured } from '@/shared/lib/supabase/client';
import {
  exportIconButtonSx,
  exportToExcel,
  formatDateForFilename,
  sanitizeFilenamePart,
} from '@/utils/exportUtils';
import { formatDateRu, getCurrentShift, isCurrentShift, type ShiftInfo } from '@/utils/shiftUtils';
import { DashboardCriticalAlert } from './components/DashboardCriticalAlert';
import { DashboardRedAlertsStrip } from './components/DashboardRedAlertsStrip';
import { DashboardEmployeesColumn } from './components/DashboardEmployeesColumn';
import { DashboardMetricCards } from './components/DashboardMetricCards';
import { DashboardObjectProgress } from './components/DashboardObjectProgress';
import { DashboardShiftEvents } from './components/DashboardShiftEvents';
import { ShiftSelector } from './components/ShiftSelector';
import styles from './DashboardPage.module.scss';

export function DashboardPage() {
  const navigate = useNavigate();
  const configured = isSupabaseConfigured();
  const [selectedShift, setSelectedShift] = useState<ShiftInfo>(() => getCurrentShift());
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [ctx, setCtx] = useState<ShiftContext>(() => emptyDashboardBundle().shiftContext);
  const [criticalAlert, setCriticalAlert] = useState<CriticalDefectAlert | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetric[]>(() => emptyDashboardBundle().metrics);
  const [employees, setEmployees] = useState<DashboardEmployee[]>([]);
  const [events, setEvents] = useState<ShiftEvent[]>([]);
  const [progress, setProgress] = useState<ShiftProgressItem[]>([]);

  const [redAlertCount, setRedAlertCount] = useState(0);
  const [redAlertCountLoading, setRedAlertCountLoading] = useState(false);
  const [redAlertCountError, setRedAlertCountError] = useState<string | null>(null);
  const [redAlertRealtimeOk, setRedAlertRealtimeOk] = useState<boolean | null>(null);

  const loadRedAlertCount = useCallback(async () => {
    if (!configured) return;
    const { data, error } = await fetchOpenCriticalRedAlertsCount();
    if (error) {
      setRedAlertCountError(error);
    } else {
      setRedAlertCountError(null);
      setRedAlertCount(data);
    }
  }, [configured]);

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
      const { data, error } = await fetchDashboardBundle(selectedShift);
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
  }, [configured, selectedShift.startTime.getTime(), selectedShift.endTime.getTime()]);

  const handleExportExcel = () => {
    const mVal = (id: string) => metrics.find((m) => m.id === id)?.value ?? '—';
    const shiftSheet: (string | number)[][] = [
      ['Смена', String(selectedShift.number)],
      ['Дата', formatDateRu(selectedShift.date)],
      ['Выполнено объектов', mVal('m1')],
      ['Активных обходчиков', mVal('m2')],
      ['Дефектов за смену', mVal('m3')],
      ['Среднее время на объект', mVal('m4')],
    ];
    const empRows = employees.map((e) => [e.name, e.locationHint, e.statusLabel]);
    const evRows = events.map((ev) => [ev.time, ev.title, ev.detail]);
    const shiftFn = sanitizeFilenamePart(String(selectedShift.number));
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

  useEffect(() => {
    if (!configured) return;
    setRedAlertCountLoading(true);
    void loadRedAlertCount().finally(() => setRedAlertCountLoading(false));
  }, [configured, loadRedAlertCount]);

  useEffect(() => {
    if (!configured) return;
    const unsub = subscribeEquipmentRedAlertsRealtime({
      onChange: () => void loadRedAlertCount(),
      onStatus: (s) => setRedAlertRealtimeOk(s === 'SUBSCRIBED'),
    });
    return () => {
      unsub();
    };
  }, [configured, loadRedAlertCount]);

  return (
    <Stack spacing={3} className={styles.wrap} sx={{ width: '100%' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
          mb: 2.5,
        }}
      >
        <Box sx={{ flex: '1 1 280px', minWidth: 0 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <Typography
              variant="h1"
              sx={{
                fontSize: '26px',
                fontWeight: 700,
                color: '#111827',
                m: 0,
                lineHeight: 1.3,
              }}
            >
              Дашборд — {selectedShift.label}
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
          </Box>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              mt: 1,
              flexWrap: 'wrap',
            }}
          >
            <Typography variant="body2" sx={{ fontSize: '14px', color: '#6b7280' }}>
              {formatDateRu(selectedShift.date)} г. • {ctx.siteLabel} • {selectedShift.shiftName} (
              {selectedShift.timeRange})
            </Typography>
            {isCurrentShift(selectedShift) ? (
              <Box
                component="span"
                sx={{
                  fontSize: '11px',
                  fontWeight: 600,
                  px: '8px',
                  py: '2px',
                  background: '#dcfce7',
                  color: '#166534',
                  borderRadius: '20px',
                }}
              >
                Сейчас
              </Box>
            ) : (
              <Box
                component="span"
                sx={{
                  fontSize: '11px',
                  fontWeight: 500,
                  px: '8px',
                  py: '2px',
                  background: '#f3f4f6',
                  color: '#6b7280',
                  borderRadius: '20px',
                }}
              >
                Архив
              </Box>
            )}
          </Box>

          <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
            <Chip
              size="small"
              color="success"
              label={`Онлайн: ${ctx.onlineCurrent} из ${ctx.onlineTotal}`}
            />
            {loading ? <CircularProgress size={18} /> : null}
          </Stack>
        </Box>

        <Box sx={{ flexShrink: 0 }}>
          <ShiftSelector selectedShift={selectedShift} onShiftSelect={setSelectedShift} />
        </Box>
      </Box>

      {!configured ? (
        <Alert severity="warning">
          Данные дашборда не загружаются: не настроено подключение к серверу. Обратитесь к администратору
          системы.
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

      {configured ? (
        <DashboardRedAlertsStrip
          count={redAlertCount}
          loading={redAlertCountLoading}
          error={redAlertCountError}
          realtimeOk={redAlertRealtimeOk}
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
