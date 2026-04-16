import {
  Box,
  Button,
  Chip,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import type {
  CriticalDefectAlert,
  DashboardEmployee,
  DashboardMetric,
  ShiftContext,
  ShiftEvent,
  ShiftProgressItem,
} from '@/entities/dashboard/model/types';
import type { Route } from '@/entities/route/model/types';
import { RouteMapper } from '@/features/route/mappers/RouteMapper';
import {
  CRITICAL_DEFECT_ALERT_MOCK,
  DASHBOARD_METRICS_MOCK,
  EMPLOYEES_ON_SHIFT_MOCK,
  SHIFT_CONTEXT_MOCK,
  SHIFT_EVENTS_MOCK,
  SHIFT_PROGRESS_MOCK,
} from '@/shared/lib/mock/dashboardAdmin.mock';
import { ROUTES_MOCK } from '@/shared/lib/mock/routes.mock';
import { API_BASE, apiFetch } from '@/shared/api/client';
import { DashboardCriticalAlert } from './components/DashboardCriticalAlert';
import { DashboardEmployeesColumn } from './components/DashboardEmployeesColumn';
import { DashboardMetricCards } from './components/DashboardMetricCards';
import { DashboardObjectProgress } from './components/DashboardObjectProgress';
import { DashboardShiftEvents } from './components/DashboardShiftEvents';
import styles from './DashboardPage.module.scss';

type DashboardBundleJson = {
  shiftContext: ShiftContext;
  metrics: DashboardMetric[];
  employees: DashboardEmployee[];
  events: ShiftEvent[];
  progress: ShiftProgressItem[];
  criticalAlert: CriticalDefectAlert | null;
};

export function DashboardPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [ctx, setCtx] = useState<ShiftContext>(SHIFT_CONTEXT_MOCK);
  const [criticalAlert, setCriticalAlert] = useState<CriticalDefectAlert | null>(
    CRITICAL_DEFECT_ALERT_MOCK,
  );
  const [metrics, setMetrics] = useState<DashboardMetric[]>(DASHBOARD_METRICS_MOCK);
  const [employees, setEmployees] = useState<DashboardEmployee[]>(
    EMPLOYEES_ON_SHIFT_MOCK,
  );
  const [events, setEvents] = useState<ShiftEvent[]>(SHIFT_EVENTS_MOCK);
  const [progress, setProgress] = useState<ShiftProgressItem[]>(SHIFT_PROGRESS_MOCK);
  const [routesPreview, setRoutesPreview] = useState<Route[]>(
    RouteMapper.listToViewModels(ROUTES_MOCK),
  );

  useEffect(() => {
    if (!API_BASE) return;
    let cancelled = false;
    void (async () => {
      const res = await apiFetch('/api/v1/dashboard');
      if (!res.ok || cancelled) return;
      const data: DashboardBundleJson = await res.json();
      if (cancelled) return;
      setCtx(data.shiftContext);
      setCriticalAlert(data.criticalAlert);
      setMetrics(data.metrics);
      setEmployees(data.employees);
      setEvents(data.events);
      setProgress(data.progress);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!API_BASE) return;
    let cancelled = false;
    void (async () => {
      const res = await apiFetch('/api/v1/routes');
      if (!res.ok || cancelled) return;
      const dtos = await res.json();
      if (cancelled) return;
      setRoutesPreview(RouteMapper.listToViewModels(dtos));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
          <Chip
            sx={{ mt: 1 }}
            size="small"
            color="success"
            label={`Онлайн: ${ctx.onlineCurrent} из ${ctx.onlineTotal}`}
          />
        </Box>
        <Button
          component={RouterLink}
          to="/tasks"
          variant="contained"
          startIcon={<AddRoundedIcon />}
          sx={{ flexShrink: 0 }}
        >
          Создать задание
        </Button>
      </Stack>

      {criticalAlert ? (
        <DashboardCriticalAlert
          alert={criticalAlert}
          onView={() => navigate('/defects')}
        />
      ) : null}

      <DashboardMetricCards metrics={metrics} />

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          aria-label="разделы дашборда"
        >
          <Tab label="Текущая смена" />
          <Tab label="Карта" />
          <Tab label="Маршруты" />
        </Tabs>
      </Box>

      {tab === 0 ? (
        <>
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
        </>
      ) : null}

      {tab === 1 ? (
        <Box
          sx={{
            minHeight: 240,
            borderRadius: 2,
            border: 1,
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            px: 2,
          }}
        >
          <Typography variant="body1" color="text.secondary" textAlign="center">
            Карта объектов и обходчиков будет доступна после подключения ГИС и трекинга
            мобильного офиса.
          </Typography>
        </Box>
      ) : null}

      {tab === 2 ? (
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Быстрый переход к демо-маршрутам энергоцеха (как в прежнем рабочем столе).
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={1}>
            {routesPreview.map((r) => (
              <Button
                key={r.id}
                component={RouterLink}
                to={`/route/${r.id}`}
                variant="outlined"
                size="small"
              >
                {r.name}
              </Button>
            ))}
            <Button component={RouterLink} to="/planning" variant="text" size="small">
              Планирование обходов
            </Button>
          </Stack>
        </Stack>
      ) : null}
    </Stack>
  );
}
