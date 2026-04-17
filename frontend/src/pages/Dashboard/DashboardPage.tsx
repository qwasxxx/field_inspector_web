import { Alert, Box, Chip, CircularProgress, Stack, Typography } from '@mui/material';
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

  return (
    <Stack spacing={3} className={styles.wrap} sx={{ width: '100%' }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-start', sm: 'flex-start' }}
        justifyContent="space-between"
        spacing={2}
      >
        <Box>
          <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
            Дашборд — Смена №{ctx.shiftNumber}
          </Typography>
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
