import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import type { EquipmentRedAlertRow } from '@/entities/factory/model/types';
import {
  fetchEquipmentRedAlerts,
  type RedAlertFilters,
  type RedAlertRealtimeStatus,
  RED_ALERT_SEVERITIES,
  RED_ALERT_STATUSES,
  subscribeEquipmentRedAlertsRealtime,
  updateRedAlertAdmin,
} from '@/features/factory/services/equipmentRedAlertsApi';
import { formatDateTime } from '@/shared/lib/formatDate';
import { isSupabaseConfigured } from '@/shared/lib/supabase/client';

function severityChipColor(sev: string | null | undefined): 'error' | 'warning' | 'info' | 'default' {
  const s = String(sev ?? '').toLowerCase();
  if (s === 'critical') return 'error';
  if (s === 'high') return 'error';
  if (s === 'medium') return 'warning';
  if (s === 'low') return 'info';
  return 'default';
}

function statusChipColor(st: string | null | undefined): 'error' | 'warning' | 'success' | 'default' {
  const s = String(st ?? '').toLowerCase();
  if (s === 'open') return 'error';
  if (s === 'acknowledged') return 'warning';
  if (s === 'resolved') return 'success';
  if (s === 'dismissed') return 'default';
  return 'default';
}

function statusLabel(st: string | null | undefined): string {
  const s = String(st ?? '').toLowerCase();
  if (s === 'open') return 'Открыта';
  if (s === 'acknowledged') return 'Принята';
  if (s === 'resolved') return 'Закрыта';
  if (s === 'dismissed') return 'Снята';
  return st ?? '—';
}

function severityLabel(sev: string | null | undefined): string {
  const s = String(sev ?? '').toLowerCase();
  const map: Record<string, string> = {
    critical: 'Критич.',
    high: 'Высокая',
    medium: 'Средняя',
    low: 'Низкая',
  };
  return map[s] ?? (sev ?? '—');
}

function previewText(text: string | null | undefined, max = 140): string {
  const t = (text ?? '').trim();
  if (!t) return '—';
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

const emptyFilters = (): RedAlertFilters => ({
  status: '',
  severity: '',
  equipmentSearch: '',
  workerSearch: '',
});

export function RedAlertsPage() {
  const configured = isSupabaseConfigured();
  const [filters, setFilters] = useState<RedAlertFilters>(emptyFilters);
  const [rows, setRows] = useState<EquipmentRedAlertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState<RedAlertRealtimeStatus | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [detail, setDetail] = useState<EquipmentRedAlertRow | null>(null);

  const loadAlerts = useCallback(async () => {
    if (!configured) {
      setLoading(false);
      return;
    }
    setLoadError(null);
    const { data, error } = await fetchEquipmentRedAlerts(filters);
    if (error) {
      setLoadError(error);
      setRows([]);
    } else {
      setRows(data);
    }
    setLoading(false);
  }, [configured, filters]);

  const scheduleRefresh = useCallback(() => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = setTimeout(() => {
      void loadAlerts();
      refreshTimerRef.current = null;
    }, 300);
  }, [loadAlerts]);

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }
    setLoading(true);
    void loadAlerts();
  }, [configured, loadAlerts]);

  useEffect(() => {
    if (!configured) return;
    const unsub = subscribeEquipmentRedAlertsRealtime({
      onChange: () => scheduleRefresh(),
      onStatus: (s) => setRealtimeStatus(s),
    });
    return () => {
      unsub();
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, [configured, scheduleRefresh]);

  const onAction = async (action: 'acknowledge' | 'resolve' | 'dismiss') => {
    if (!detail?.id) return;
    setActionError(null);
    setActionLoading(true);
    const { error } = await updateRedAlertAdmin(String(detail.id), action);
    setActionLoading(false);
    if (error) {
      setActionError(error);
      return;
    }
    setDetail(null);
    await loadAlerts();
  };

  const realtimeAlert =
    realtimeStatus && realtimeStatus !== 'SUBSCRIBED' ? (
      <Alert severity="warning" sx={{ mb: 2 }}>
        Live-обновления: статус канала «{realtimeStatus}». Список может обновляться с задержкой.
      </Alert>
    ) : null;

  return (
    <Box sx={{ width: '100%' }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <WarningAmberRoundedIcon color="error" fontSize="large" />
        <Typography variant="h4" component="h1" fontWeight={700}>
          Красные тревоги
        </Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Оперативные сигналы с оборудования от обходчиков. Новые записи подтягиваются через Supabase Realtime.
      </Typography>

      {!configured ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Supabase не настроен.
        </Alert>
      ) : null}
      {loadError ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {loadError}
        </Alert>
      ) : null}
      {realtimeAlert}

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Фильтры
        </Typography>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} flexWrap="wrap">
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="red-status-filter">Статус</InputLabel>
            <Select
              labelId="red-status-filter"
              label="Статус"
              value={filters.status || ''}
              onChange={(e) =>
                setFilters((f) => ({ ...f, status: e.target.value as RedAlertFilters['status'] }))
              }
            >
              <MenuItem value="">Все</MenuItem>
              {RED_ALERT_STATUSES.map((s) => (
                <MenuItem key={s} value={s}>
                  {statusLabel(s)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="red-sev-filter">Важность</InputLabel>
            <Select
              labelId="red-sev-filter"
              label="Важность"
              value={filters.severity || ''}
              onChange={(e) =>
                setFilters((f) => ({ ...f, severity: e.target.value as RedAlertFilters['severity'] }))
              }
            >
              <MenuItem value="">Все</MenuItem>
              {RED_ALERT_SEVERITIES.map((s) => (
                <MenuItem key={s} value={s}>
                  {severityLabel(s)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            size="small"
            label="Оборудование / id"
            value={filters.equipmentSearch}
            onChange={(e) => setFilters((f) => ({ ...f, equipmentSearch: e.target.value }))}
            sx={{ minWidth: 220 }}
          />
          <TextField
            size="small"
            label="Имя обходчика"
            value={filters.workerSearch}
            onChange={(e) => setFilters((f) => ({ ...f, workerSearch: e.target.value }))}
            sx={{ minWidth: 200 }}
          />
        </Stack>
      </Paper>

      {loading ? (
        <CircularProgress size={28} />
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Важность</TableCell>
                <TableCell>Статус</TableCell>
                <TableCell>Оборудование</TableCell>
                <TableCell>Площадка / участок</TableCell>
                <TableCell>Кто</TableCell>
                <TableCell>Время</TableCell>
                <TableCell>Заголовок</TableCell>
                <TableCell>Описание</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    {configured ? 'Нет записей по фильтрам.' : '—'}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r, idx) => (
                  <TableRow
                    key={r.id != null ? String(r.id) : `r-${idx}`}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => setDetail(r)}
                  >
                    <TableCell>
                      <Chip
                        size="small"
                        label={severityLabel(r.severity)}
                        color={severityChipColor(r.severity)}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={statusLabel(r.status)}
                        color={statusChipColor(r.status)}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {r.equipment_name ?? '—'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {r.equipment_id ?? ''}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {r.site_name ?? '—'} / {r.area_name ?? '—'}
                    </TableCell>
                    <TableCell>{r.triggered_by_name ?? '—'}</TableCell>
                    <TableCell>{formatDateTime(r.created_at as string | undefined)}</TableCell>
                    <TableCell>{r.title ?? '—'}</TableCell>
                    <TableCell sx={{ maxWidth: 280 }}>{previewText(r.description as string | undefined)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={Boolean(detail)} onClose={() => setDetail(null)} maxWidth="sm" fullWidth>
        {detail ? (
          <>
            <DialogTitle sx={{ pr: 6 }}>
              Инцидент
              <IconButton
                aria-label="Закрыть"
                onClick={() => setDetail(null)}
                sx={{ position: 'absolute', right: 8, top: 8 }}
              >
                <CloseRoundedIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers>
              {actionError ? (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setActionError(null)}>
                  {actionError}
                </Alert>
              ) : null}
              <Stack spacing={1.5}>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Chip size="small" label={severityLabel(detail.severity)} color={severityChipColor(detail.severity)} />
                  <Chip size="small" label={statusLabel(detail.status)} color={statusChipColor(detail.status)} />
                </Stack>
                <Typography variant="subtitle2" color="text.secondary">
                  Оборудование
                </Typography>
                <Typography variant="body1">{detail.equipment_name ?? '—'}</Typography>
                <Typography variant="caption" color="text.secondary">
                  ID: {detail.equipment_id ?? '—'}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary">
                  Площадка / участок
                </Typography>
                <Typography variant="body1">
                  {detail.site_name ?? '—'} / {detail.area_name ?? '—'}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary">
                  Задание
                </Typography>
                {detail.task_id ? (
                  <Button component={RouterLink} to={`/tasks/${detail.task_id}`} size="small" variant="outlined">
                    Открыть задание {String(detail.task_id).slice(0, 8)}…
                  </Button>
                ) : (
                  <Typography variant="body2">Не привязано</Typography>
                )}
                <Typography variant="subtitle2" color="text.secondary">
                  Время / источник
                </Typography>
                <Typography variant="body2">
                  {formatDateTime(detail.created_at as string | undefined)} · источник: {detail.source ?? '—'}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary">
                  Инициатор
                </Typography>
                <Typography variant="body2">
                  {detail.triggered_by_name ?? '—'} ({detail.triggered_by ?? '—'})
                </Typography>
                <Typography variant="subtitle2" color="text.secondary">
                  Заголовок
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {detail.title ?? '—'}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary">
                  Описание
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {detail.description?.trim() ? detail.description : '—'}
                </Typography>
                {(detail.acknowledged_at || detail.resolved_at) && (
                  <>
                    <Typography variant="subtitle2" color="text.secondary">
                      Журнал
                    </Typography>
                    <Typography variant="caption" display="block">
                      Принято: {formatDateTime(detail.acknowledged_at as string | undefined)} ·{' '}
                      {detail.acknowledged_by ?? '—'}
                    </Typography>
                    <Typography variant="caption" display="block">
                      Закрыто: {formatDateTime(detail.resolved_at as string | undefined)} ·{' '}
                      {detail.resolved_by ?? '—'}
                    </Typography>
                  </>
                )}
              </Stack>
            </DialogContent>
            <DialogActions sx={{ flexWrap: 'wrap', gap: 1, px: 3, py: 2 }}>
              <Button onClick={() => setDetail(null)}>Закрыть окно</Button>
              <Box sx={{ flex: 1 }} />
              <Button
                color="warning"
                variant="outlined"
                disabled={actionLoading || detail.status !== 'open'}
                onClick={() => void onAction('acknowledge')}
              >
                Принять к учёту
              </Button>
              <Button
                color="success"
                variant="contained"
                disabled={
                  actionLoading || detail.status === 'resolved' || detail.status === 'dismissed'
                }
                onClick={() => void onAction('resolve')}
              >
                Закрыть инцидент
              </Button>
              <Button
                color="inherit"
                variant="outlined"
                disabled={
                  actionLoading || detail.status === 'resolved' || detail.status === 'dismissed'
                }
                onClick={() => void onAction('dismiss')}
              >
                Снять с контроля
              </Button>
            </DialogActions>
          </>
        ) : null}
      </Dialog>
    </Box>
  );
}
