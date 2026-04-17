import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import type { ProfileRow } from '@/entities/factory/model/types';
import { useWorkers } from '@/features/factory/hooks/useWorkers';
import { MOCK_WORKERS_FOR_ASSIGN } from '@/features/objects/mockObjects';

export type AssignTaskPayload = {
  title: string;
  equipment_ids: string[];
  worker_id: string;
  created_at: string;
};

export type AssignTaskModalProps = {
  open: boolean;
  equipmentIds: string[];
  onClose: () => void;
  onConfirm: (payload: AssignTaskPayload) => void;
};

export function AssignTaskModal({
  open,
  equipmentIds,
  onClose,
  onConfirm,
}: AssignTaskModalProps) {
  const { rows: workers, loading } = useWorkers();

  const workerOptions = useMemo(() => {
    const withIds = workers.filter((w): w is ProfileRow & { id: string } => Boolean(w.id));
    if (withIds.length > 0) {
      return withIds.map((w) => ({
        id: w.id,
        name: String(w.full_name ?? w.username ?? w.id),
      }));
    }
    return MOCK_WORKERS_FOR_ASSIGN.map((w) => ({ id: w.id, name: w.name }));
  }, [workers]);

  const [workerId, setWorkerId] = useState('');

  useEffect(() => {
    if (!open || loading) return;
    const id = workerOptions[0]?.id ?? '';
    setWorkerId(id);
  }, [open, loading, workerOptions]);

  const handleConfirm = () => {
    const payload: AssignTaskPayload = {
      title: 'Inspection task',
      equipment_ids: [...equipmentIds],
      worker_id: workerId,
      created_at: new Date().toISOString(),
    };
    onConfirm(payload);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pr: 5 }}>
        Назначить обход
        <IconButton
          aria-label="закрыть"
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Выбрано единиц оборудования: {equipmentIds.length}
          </Typography>
          {workers.filter((w) => Boolean(w.id)).length === 0 && !loading ? (
            <Typography variant="caption" color="text.secondary">
              В <code>profiles</code> нет обходчиков — показан демо-список.
            </Typography>
          ) : null}
          <FormControl fullWidth size="small">
            <InputLabel id="assign-worker-label">Обходчик</InputLabel>
            <Select
              labelId="assign-worker-label"
              label="Обходчик"
              value={workerId}
              onChange={(e) => setWorkerId(e.target.value)}
              disabled={workerOptions.length === 0}
            >
              {workerOptions.map((w) => (
                <MenuItem key={w.id} value={w.id}>
                  {w.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose}>Отмена</Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={workerOptions.length === 0 || !workerId}
        >
          Подтвердить
        </Button>
      </DialogActions>
    </Dialog>
  );
}
