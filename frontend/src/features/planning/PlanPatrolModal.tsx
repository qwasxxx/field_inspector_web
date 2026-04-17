import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import PrecisionManufacturingOutlinedIcon from '@mui/icons-material/PrecisionManufacturingOutlined';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useEffect, useMemo, useState } from 'react';
import type { ProfileRow } from '@/entities/factory/model/types';
import { useWorkers } from '@/features/factory/hooks/useWorkers';
import type { ObjectNode } from '@/features/objects/types';
import { MOCK_WORKERS_FOR_ASSIGN } from '@/features/objects/mockObjects';
import { createPlannedInspection } from '@/features/planning/plannedInspectionsApi';
import type { CreateTaskItemPayload } from '@/features/factory/services/inspectionTasksApi';
import { isSupabaseConfigured } from '@/shared/lib/supabase/client';

function formatWorkerLabel(w: ProfileRow): string {
  const name = (w.full_name ?? '').trim() || (w.username ?? '').trim();
  if (name) return name;
  return String(w.id ?? '—');
}

function toDatetimeLocalValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export type PlanPatrolModalProps = {
  open: boolean;
  onClose: () => void;
  selectedNodes: ObjectNode[];
  /** Локальная дата/время по умолчанию для поля «когда выдать задание» */
  defaultWhen: Date;
  onCreated?: (planId: string) => void;
};

export function PlanPatrolModal({
  open,
  onClose,
  selectedNodes,
  defaultWhen,
  onCreated,
}: PlanPatrolModalProps) {
  const theme = useTheme();
  const { rows: workers, loading: workersLoading } = useWorkers();
  const configured = isSupabaseConfigured();

  const workerOptions = useMemo(() => {
    const withIds = workers.filter((w): w is ProfileRow & { id: string } => Boolean(w.id));
    if (withIds.length > 0) {
      return withIds.map((w) => ({ id: w.id, label: formatWorkerLabel(w) }));
    }
    return MOCK_WORKERS_FOR_ASSIGN.map((w) => ({ id: w.id, label: w.name }));
  }, [workers]);

  const [title, setTitle] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [workerId, setWorkerId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (selectedNodes.length > 0) {
      const short = selectedNodes
        .slice(0, 2)
        .map((n) => n.name)
        .join(', ');
      setTitle((prev) => (prev.trim() ? prev : `Обход: ${short}${selectedNodes.length > 2 ? '…' : ''}`));
    } else {
      setTitle('');
    }
    setScheduledAt(toDatetimeLocalValue(defaultWhen));
  }, [open, selectedNodes, defaultWhen]);

  useEffect(() => {
    if (!open || workersLoading) return;
    const id = workerOptions[0]?.id ?? '';
    setWorkerId(id);
  }, [open, workersLoading, workerOptions]);

  const handleSubmit = async () => {
    setError(null);
    if (!configured) {
      setError('Сервис данных не настроен. Обратитесь к администратору.');
      return;
    }
    if (!title.trim()) {
      setError('Укажите название.');
      return;
    }
    if (!workerId) {
      setError('Выберите исполнителя.');
      return;
    }
    if (selectedNodes.length < 1) {
      setError('Выберите хотя бы одну единицу оборудования в дереве слева.');
      return;
    }
    if (!scheduledAt) {
      setError('Укажите дату и время выдачи задания.');
      return;
    }

    const items: CreateTaskItemPayload[] = selectedNodes.map((n) => ({
      equipment_name: n.name.trim(),
      equipment_location: '',
      equipment_code: (n.code ?? '').trim(),
    }));

    setSaving(true);
    try {
      const { data, error: err } = await createPlannedInspection(
        {
          title: title.trim(),
          site_name: '',
          area_name: '',
          shift_label: '',
          instructions: '',
          scheduled_at: new Date(scheduledAt).toISOString(),
          worker_user_id: workerId,
        },
        items,
      );
      if (err) {
        setError(err);
        return;
      }
      if (data.id) {
        onCreated?.(data.id);
        onClose();
      } else {
        setError('План не сохранён.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          elevation: 0,
          sx: {
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            boxShadow:
              theme.palette.mode === 'light'
                ? '0 24px 80px rgba(0,0,0,0.12)'
                : '0 24px 80px rgba(0,0,0,0.45)',
          },
        },
      }}
    >
      <DialogTitle sx={{ pr: 6, pt: 2.5, pb: 1 }}>
        <Typography variant="h6" fontWeight={800} component="span" display="block">
          Запланировать обход
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, pr: 1 }}>
          Проверьте список оборудования, время выдачи и исполнителя.
        </Typography>
        <IconButton
          aria-label="закрыть"
          onClick={onClose}
          disabled={saving}
          sx={{ position: 'absolute', right: 8, top: 12 }}
        >
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ px: 2.5, py: 2 }}>
        <Stack spacing={2.25}>
          {!configured ? (
            <Alert severity="warning">
              Сохранение недоступно: подключение к данным не настроено.
            </Alert>
          ) : null}
          {error ? (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          ) : null}

          <Box>
            <Typography variant="subtitle2" fontWeight={800} gutterBottom>
              Оборудование ({selectedNodes.length})
            </Typography>
            <Paper
              variant="outlined"
              sx={{
                maxHeight: 220,
                overflow: 'auto',
                borderRadius: 2,
                bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.02 : 0.06),
              }}
            >
              <List dense disablePadding>
                {selectedNodes.length === 0 ? (
                  <ListItem sx={{ py: 2 }}>
                    <ListItemText
                      primary="Ничего не выбрано"
                      secondary="Отметьте оборудование в дереве объектов"
                      primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                    />
                  </ListItem>
                ) : (
                  selectedNodes.map((n) => (
                    <ListItem key={n.id} sx={{ py: 0.75, px: 1.5 }}>
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <PrecisionManufacturingOutlinedIcon fontSize="small" color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={n.name}
                        secondary={n.code ? `Код: ${n.code}` : null}
                        primaryTypographyProps={{ variant: 'body2', fontWeight: 700 }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItem>
                  ))
                )}
              </List>
            </Paper>
          </Box>

          <TextField
            label="Название"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            fullWidth
            size="small"
          />

          <TextField
            label="Когда выдать задание исполнителю"
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            fullWidth
            size="small"
            InputLabelProps={{ shrink: true }}
            helperText="В указанное время (или позже при срабатывании автоматической выдачи) появится задание у обходчика"
          />

          <FormControl fullWidth size="small" disabled={workersLoading}>
            <InputLabel id="plan-worker-label">Исполнитель</InputLabel>
            <Select
              labelId="plan-worker-label"
              label="Исполнитель"
              value={workerId}
              onChange={(e) => setWorkerId(e.target.value)}
            >
              {workerOptions.map((w) => (
                <MenuItem key={w.id} value={w.id}>
                  {w.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {workers.filter((w) => Boolean(w.id)).length === 0 && !workersLoading ? (
            <Typography variant="caption" color="text.secondary">
              В базе нет профилей обходчиков — показан демо-список для проверки интерфейса.
            </Typography>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 2.5, py: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={saving} sx={{ textTransform: 'none', borderRadius: 2 }}>
          Отмена
        </Button>
        <Button
          variant="contained"
          disableElevation
          onClick={() => void handleSubmit()}
          disabled={saving || !configured || workerOptions.length === 0 || selectedNodes.length < 1}
          sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700, px: 2 }}
        >
          {saving ? <CircularProgress size={22} color="inherit" /> : 'Сохранить план'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
