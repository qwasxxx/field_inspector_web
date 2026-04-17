import { Alert, Box, CircularProgress, Paper, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  fetchAnalyticsOverview,
  fetchReportsPerDayLastDays,
  type AnalyticsOverview,
  type ReportsPerDayPoint,
} from '@/features/factory/services/analyticsOverviewApi';
import { isSupabaseConfigured } from '@/shared/lib/supabase/client';

function StatCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: number | string;
  subtitle?: string;
}) {
  return (
    <Paper variant="outlined" sx={{ p: 2.5, height: '100%' }}>
      <Typography variant="caption" color="text.secondary">
        {title}
      </Typography>
      <Typography variant="h4" fontWeight={700} sx={{ mt: 0.5 }}>
        {value}
      </Typography>
      {subtitle ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {subtitle}
        </Typography>
      ) : null}
    </Paper>
  );
}

export function AnalyticsPage() {
  const theme = useTheme();
  const configured = isSupabaseConfigured();
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [chart, setChart] = useState<ReportsPerDayPoint[]>([]);
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
      setError(null);
      const [o, series] = await Promise.all([
        fetchAnalyticsOverview(),
        fetchReportsPerDayLastDays(14),
      ]);
      if (cancelled) return;
      if (o.error) setError(o.error);
      setOverview(o.data);
      setChart(series);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [configured]);

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
        Аналитика
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Сводка по заданиям и отчётам обходчиков за последние 30 дней и динамика отчётов по дням.
      </Typography>

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
        <>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(4, 1fr)',
              },
              gap: 2,
              mb: 3,
            }}
          >
            <StatCard title="Всего заданий" value={overview?.tasksTotal ?? '—'} />
            <StatCard
              title="Завершено заданий"
              value={overview?.tasksCompleted ?? '—'}
              subtitle="Статусы «завершено» и «с замечаниями»"
            />
            <StatCard
              title="Отчётов за 30 дней"
              value={overview?.reportsLast30d ?? '—'}
              subtitle="Отправлено из приложения"
            />
            <StatCard
              title="Дефектов за 30 дней"
              value={overview?.defectsLast30d ?? '—'}
              subtitle="Отмечено в отчётах"
            />
          </Box>

          <Paper variant="outlined" sx={{ p: 2.5 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Отчёты по дням (14 дней)
            </Typography>
            {chart.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Нет данных для графика.
              </Typography>
            ) : (
              <Box sx={{ width: '100%', height: 320, mt: 1 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chart} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} angle={-35} height={60} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" name="Отчётов" fill={theme.palette.primary.main} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            )}
          </Paper>
        </>
      )}
    </Box>
  );
}
