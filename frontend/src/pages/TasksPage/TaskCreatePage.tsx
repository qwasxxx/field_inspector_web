import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { createInspectionTask } from '@/features/factory/services/inspectionTasksApi';
import type { CreateTaskItemPayload, CreateTaskPayload } from '@/features/factory/services/inspectionTasksApi';
import { useWorkers } from '@/features/factory/hooks/useWorkers';
import { isSupabaseConfigured } from '@/shared/lib/supabase/client';

const emptyItem = (): CreateTaskItemPayload => ({
  equipment_name: '',
  equipment_location: '',
  equipment_code: '',
});

export function TaskCreatePage() {
  const navigate = useNavigate();
  const { rows: workers, loading: workersLoading } = useWorkers();
  const configured = isSupabaseConfigured();

  const [title, setTitle] = useState('');
  const [siteName, setSiteName] = useState('');
  const [areaName, setAreaName] = useState('');
  const [shiftLabel, setShiftLabel] = useState('');
  const [instructions, setInstructions] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [workerId, setWorkerId] = useState<string>('');
  const [items, setItems] = useState<CreateTaskItemPayload[]>([emptyItem()]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);
  const removeItem = (index: number) =>
    setItems((prev) => prev.filter((_, i) => i !== index));
  const patchItem = (index: number, patch: Partial<CreateTaskItemPayload>) =>
    setItems((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    const payload: CreateTaskPayload = {
      title: title.trim(),
      site_name: siteName.trim(),
      area_name: areaName.trim(),
      shift_label: shiftLabel.trim(),
      instructions: instructions.trim(),
      due_at: dueAt ? new Date(dueAt).toISOString() : null,
      worker_id: workerId || null,
    };
    if (!payload.title) {
      setFormError('Укажите название');
      return;
    }
    const cleanItems = items.filter(
      (it) =>
        it.equipment_name.trim() ||
        it.equipment_location.trim() ||
        it.equipment_code.trim(),
    );
    setSaving(true);
    try {
      const { data, error } = await createInspectionTask(payload, cleanItems);
      if (error) {
        setFormError(error);
        return;
      }
      if (data.taskId) {
        navigate(`/tasks/${data.taskId}`, { replace: true });
      } else {
        setFormError(
          configured
            ? 'Запись не создана (проверьте таблицы на бэкенде).'
            : 'Режим без Supabase — данные только в консоли.',
        );
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 720 }} component="form" onSubmit={handleSubmit}>
      <Typography variant="h4" component="h1" gutterBottom>
        Новое задание
      </Typography>
      <Typography variant="body2" sx={{ mb: 2 }}>
        <RouterLink to="/tasks">← К списку</RouterLink>
      </Typography>

      {!configured ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          Без переменных Supabase отправка не сохранится в БД (см. консоль).
        </Alert>
      ) : null}
      {formError ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {formError}
        </Alert>
      ) : null}

      <Stack spacing={2}>
        <TextField
          label="Название"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          fullWidth
        />
        <TextField
          label="Площадка"
          value={siteName}
          onChange={(e) => setSiteName(e.target.value)}
          fullWidth
        />
        <TextField
          label="Участок"
          value={areaName}
          onChange={(e) => setAreaName(e.target.value)}
          fullWidth
        />
        <TextField
          label="Смена"
          value={shiftLabel}
          onChange={(e) => setShiftLabel(e.target.value)}
          fullWidth
        />
        <TextField
          label="Инструкции"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          fullWidth
          multiline
          minRows={3}
        />
        <TextField
          label="Срок (локальное время)"
          type="datetime-local"
          value={dueAt}
          onChange={(e) => setDueAt(e.target.value)}
          fullWidth
          InputLabelProps={{ shrink: true }}
        />

        <FormControl fullWidth disabled={workersLoading}>
          <InputLabel id="worker-label">Исполнитель</InputLabel>
          <Select
            labelId="worker-label"
            label="Исполнитель"
            value={workerId}
            onChange={(e) => setWorkerId(e.target.value as string)}
          >
            <MenuItem value="">
              <em>Не назначать</em>
            </MenuItem>
            {workers.map((w) => (
              <MenuItem key={String(w.id)} value={w.id ?? ''}>
                {w.full_name ?? w.username ?? w.id ?? '—'}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Divider />
        <Typography variant="subtitle1">Позиции оборудования</Typography>
        {items.map((it, index) => (
          <Paper key={index} variant="outlined" sx={{ p: 2 }}>
            <Stack spacing={1.5}>
              <TextField
                label="Оборудование"
                value={it.equipment_name}
                onChange={(e) => patchItem(index, { equipment_name: e.target.value })}
                fullWidth
                size="small"
              />
              <TextField
                label="Место"
                value={it.equipment_location}
                onChange={(e) => patchItem(index, { equipment_location: e.target.value })}
                fullWidth
                size="small"
              />
              <TextField
                label="Код (необязательно)"
                value={it.equipment_code}
                onChange={(e) => patchItem(index, { equipment_code: e.target.value })}
                fullWidth
                size="small"
              />
              {items.length > 1 ? (
                <Button
                  type="button"
                  size="small"
                  color="inherit"
                  startIcon={<DeleteOutlineRoundedIcon />}
                  onClick={() => removeItem(index)}
                >
                  Удалить позицию
                </Button>
              ) : null}
            </Stack>
          </Paper>
        ))}
        <Button
          type="button"
          variant="outlined"
          startIcon={<AddRoundedIcon />}
          onClick={addItem}
          sx={{ alignSelf: 'flex-start' }}
        >
          Добавить позицию
        </Button>

        <Stack direction="row" spacing={2} sx={{ pt: 1 }}>
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? <CircularProgress size={22} color="inherit" /> : 'Сохранить'}
          </Button>
          <Button component={RouterLink} to="/tasks" disabled={saving}>
            Отмена
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
