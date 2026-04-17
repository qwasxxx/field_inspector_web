import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import type { EquipmentRedAlertRow } from '@/entities/factory/model/types';
import { useTaskDetail } from '@/features/factory/hooks/useTaskDetail';
import { fetchRedAlertsForTask } from '@/features/factory/services/equipmentRedAlertsApi';
import { formatDateTime } from '@/shared/lib/formatDate';
import { isSupabaseConfigured } from '@/shared/lib/supabase/client';

export function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { bundle, loading, error } = useTaskDetail(id);
  const configured = isSupabaseConfigured();
  const [taskRedAlerts, setTaskRedAlerts] = useState<EquipmentRedAlertRow[]>([]);
  const [taskRedAlertsError, setTaskRedAlertsError] = useState<string | null>(null);

  useEffect(() => {
    if (!configured || !id?.trim()) {
      setTaskRedAlerts([]);
      setTaskRedAlertsError(null);
      return;
    }
    let cancelled = false;
    void fetchRedAlertsForTask(id).then(({ data, error: e }) => {
      if (cancelled) return;
      if (e) {
        setTaskRedAlertsError(e);
        setTaskRedAlerts([]);
      } else {
        setTaskRedAlertsError(null);
        setTaskRedAlerts(data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [configured, id]);
  const t = bundle?.task;
  const routeItems = bundle?.items ?? [];
  const hasRouteItems = routeItems.length > 0;

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Задание
      </Typography>
      <Typography variant="body2" sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
        <RouterLink to="/tasks">← К списку заданий</RouterLink>
        {configured && id ? (
          <Button component={RouterLink} to={`/chats?task=${encodeURIComponent(id)}`} variant="outlined" size="small">
            Открыть чат
          </Button>
        ) : null}
      </Typography>

      {!configured ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Карточка недоступна: не настроено подключение к данным.
        </Alert>
      ) : null}
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      {loading ? (
        <CircularProgress size={28} />
      ) : !t ? (
        <Typography color="text.secondary">Нет данных.</Typography>
      ) : (
        <>
          <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Название
            </Typography>
            <Typography variant="body1" gutterBottom>
              {t.title ?? '—'}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              Площадка / участок
            </Typography>
            <Typography variant="body1" gutterBottom>
              {t.site_name ?? '—'} / {t.area_name ?? '—'}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              Статус
            </Typography>
            <Typography variant="body1" gutterBottom>
              {t.status ?? '—'}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              Срок
            </Typography>
            <Typography variant="body1" gutterBottom>
              {formatDateTime(t.due_at as string | undefined)}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              Исполнитель
            </Typography>
            <Typography variant="body1" gutterBottom>
              {bundle?.worker?.full_name ?? bundle?.worker?.username ?? '—'}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              Начало / окончание / длительность (мин.)
            </Typography>
            <Typography variant="body1" gutterBottom>
              {formatDateTime(t.started_at as string | undefined)} /{' '}
              {formatDateTime(t.completed_at as string | undefined)} /{' '}
              {t.duration_minutes != null ? String(t.duration_minutes) : '—'}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              Статус выполнения
            </Typography>
            <Typography variant="body1">{t.execution_status ?? '—'}</Typography>
          </Paper>

          {taskRedAlertsError ? (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Красные тревоги по заданию: {taskRedAlertsError}
            </Alert>
          ) : null}
          {taskRedAlerts.length > 0 ? (
            <Paper variant="outlined" sx={{ p: 2, mb: 2, borderColor: 'error.light' }}>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom color="error">
                Открытые красные тревоги по этому заданию
              </Typography>
              <Stack spacing={1} sx={{ mb: 1 }}>
                {taskRedAlerts.map((r) => (
                  <Box
                    key={r.id != null ? String(r.id) : String(r.created_at)}
                    sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}
                  >
                    <Chip size="small" color="error" label={r.severity ?? '—'} variant="outlined" />
                    <Typography variant="body2">
                      {r.equipment_name ?? r.equipment_id ?? '—'} — {r.title ?? ''}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDateTime(r.created_at as string | undefined)}
                    </Typography>
                  </Box>
                ))}
              </Stack>
              <Button component={RouterLink} to="/red-alerts" size="small" variant="outlined" color="error">
                Центр тревог
              </Button>
            </Paper>
          ) : null}

          <Typography variant="h6" gutterBottom>
            Позиции оборудования
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Оборудование</TableCell>
                  <TableCell>Место</TableCell>
                  <TableCell>Код</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {hasRouteItems ? (
                  routeItems.map((it, idx) => (
                    <TableRow key={it.id != null ? String(it.id) : `i-${idx}`}>
                      <TableCell>{it.equipment_name ?? '—'}</TableCell>
                      <TableCell>{it.equipment_location ?? '—'}</TableCell>
                      <TableCell>{it.equipment_code ?? '—'}</TableCell>
                    </TableRow>
                  ))
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={3}>
                      Позиции маршрута не загружены — см. сообщение об ошибке выше.
                    </TableCell>
                  </TableRow>
                ) : (
                  <TableRow>
                    <TableCell colSpan={3}>
                      В задании нет позиций оборудования (маршрут не был сохранён).
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
}
