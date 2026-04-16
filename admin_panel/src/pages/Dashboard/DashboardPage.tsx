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
import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
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
import { DashboardCriticalAlert } from './components/DashboardCriticalAlert';
import { DashboardEmployeesColumn } from './components/DashboardEmployeesColumn';
import { DashboardMetricCards } from './components/DashboardMetricCards';
import { DashboardObjectProgress } from './components/DashboardObjectProgress';
import { DashboardShiftEvents } from './components/DashboardShiftEvents';
import styles from './DashboardPage.module.scss';

const routesPreview: Route[] = RouteMapper.listToViewModels(ROUTES_MOCK);

export function DashboardPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);

  const ctx = SHIFT_CONTEXT_MOCK;

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

      <DashboardCriticalAlert
        alert={CRITICAL_DEFECT_ALERT_MOCK}
        onView={() => navigate('/defects')}
      />

      <DashboardMetricCards metrics={DASHBOARD_METRICS_MOCK} />

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
            <DashboardEmployeesColumn employees={EMPLOYEES_ON_SHIFT_MOCK} />
            <DashboardShiftEvents events={SHIFT_EVENTS_MOCK} />
          </Box>
          <DashboardObjectProgress items={SHIFT_PROGRESS_MOCK} />
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
