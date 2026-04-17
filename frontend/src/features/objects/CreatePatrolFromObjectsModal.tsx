import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
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
  ListItemText,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import type { ProfileRow } from '@/entities/factory/model/types';
import { useWorkers } from '@/features/factory/hooks/useWorkers';
import type { ObjectNode } from '@/features/objects/types';
import { MOCK_WORKERS_FOR_ASSIGN } from '@/features/objects/mockObjects';
import { createInspectionTask } from '@/features/factory/services/inspectionTasksApi';
import type { CreateTaskItemPayload } from '@/features/factory/services/inspectionTasksApi';
import { isSupabaseConfigured } from '@/shared/lib/supabase/client';

/** Только имя (или логин), без табельного кода — как в интерфейсе для админа. */
function formatWorkerLabel(w: ProfileRow): string {
  const name = (w.full_name ?? '').trim() || (w.username ?? '').trim();
  if (name) return name;
  return String(w.id ?? '—');
}

export type CreatePatrolFromObjectsModalProps = {
  open: boolean;
  onClose: () => void;
  /** Только узлы с типом equipment. */
  selectedNodes: ObjectNode[];
  onCreated?: (taskId: string) => void;
};

export function CreatePatrolFromObjectsModal({
  open,
  onClose,
  selectedNodes,
  onCreated,
}: CreatePatrolFromObjectsModalProps) {
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
  const [dueAt, setDueAt] = useState('');
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
  }, [open, selectedNodes]);

  useEffect(() => {
    if (!open || workersLoading) return;
    const id = workerOptions[0]?.id ?? '';
    setWorkerId(id);
  }, [open, workersLoading, workerOptions]);

  const handleSubmit = async () => {
    setError(null);
    if (!configured) {
      setError('Сервис данных не настроен.');
      return;
    }
    if (!title.trim()) {
      setError('Укажите название задания.');
      return;
    }
    if (!workerId) {
      setError('Выберите исполнителя.');
      return;
    }
    if (selectedNodes.length < 1) {
      setError('Выберите хотя бы одну единицу оборудования.');
      return;
    }

    const items: CreateTaskItemPayload[] = selectedNodes.map((n) => ({
      equipment_name: n.name.trim(),
      equipment_location: '',
      equipment_code: (n.code ?? '').trim(),
    }));

    setSaving(true);
    try {
      const { data, error: err } = await createInspectionTask(
        {
          title: title.trim(),
          site_name: '',
          area_name: '',
          shift_label: '',
          instructions: '',
          due_at: dueAt ? new Date(dueAt).toISOString() : null,
          worker_id: workerId,
        },
        items,
      );
      if (err) {
        setError(err);
        return;
      }
      if (data.taskId) {
        onCreated?.(data.taskId);
        onClose();
      } else {
        setError('Задание не создано: нет идентификатора.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pr: 5 }}>
        Назначить обход
        <IconButton
          aria-label="закрыть"
          onClick={onClose}
          disabled={saving}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
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
            <Typography variant="subtitle2" gutterBottom>
              Оборудование в маршруте ({selectedNodes.length})
            </Typography>
            <List dense disablePadding sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              {selectedNodes.map((n) => (
                <ListItem key={n.id} disablePadding sx={{ px: 1.5, py: 0.5 }}>
                  <ListItemText
                    primary={n.name}
                    secondary={n.code ? `Код: ${n.code}` : null}
                    primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>

          <TextField
            label="Название задания"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            fullWidth
            size="small"
          />

          <TextField
            label="Срок выполнения"
            type="datetime-local"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
            fullWidth
            size="small"
            InputLabelProps={{ shrink: true }}
            helperText="Необязательно"
          />

          <FormControl fullWidth size="small" disabled={workersLoading}>
            <InputLabel id="patrol-worker-label">Исполнитель</InputLabel>
            <Select
              labelId="patrol-worker-label"
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
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={saving}>
          Отмена
        </Button>
        <Button
          variant="contained"
          onClick={() => void handleSubmit()}
          disabled={saving || !configured || workerOptions.length === 0}
        >
          {saving ? <CircularProgress size={22} color="inherit" /> : 'Создать задание'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
