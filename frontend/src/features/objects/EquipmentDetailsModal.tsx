import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import {
  Box,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { formatRelativeRu } from '@/features/objects/formatRelativeRu';
import type { ObjectNode } from '@/features/objects/types';
import {
  fetchEquipmentModalStats,
  type EquipmentModalStats,
} from '@/hooks/useEquipmentReadings';

const EQUIP_TYPE_RU: Record<string, string> = {
  transformer: 'Трансформатор',
  pump: 'Насос',
  switchboard: 'Щит',
  cable: 'Кабель',
  fan: 'Вентиляция',
  valve: 'Арматура',
};

export type EquipmentDetailsModalProps = {
  node: ObjectNode | null;
  open: boolean;
  onClose: () => void;
};

export function EquipmentDetailsModal({
  node,
  open,
  onClose,
}: EquipmentDetailsModalProps) {
  const [stats, setStats] = useState<EquipmentModalStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !node || node.type !== 'equipment') {
      setStats(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void fetchEquipmentModalStats(node.id).then((s) => {
      if (!cancelled) {
        setStats(s);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [open, node?.id, node?.type]);

  if (!node) return null;

  const eq = node.equipmentType;
  const typeLabel =
    (eq && EQUIP_TYPE_RU[eq]) ?? (eq ? eq : 'Оборудование');

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pr: 5 }}>
        {node.name}
        <IconButton
          aria-label="закрыть"
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={32} />
          </Box>
        ) : (
          <Stack spacing={2}>
            {node.code ? (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Код
                </Typography>
                <Typography variant="body1">{node.code}</Typography>
              </Box>
            ) : null}
            <Box>
              <Typography variant="caption" color="text.secondary">
                Тип
              </Typography>
              <Typography variant="body1">{typeLabel}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Последнее показание
              </Typography>
              <Typography variant="body1">
                {stats?.lastReadingAt
                  ? formatRelativeRu(stats.lastReadingAt)
                  : '—'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Последний осмотр (запись)
              </Typography>
              <Typography variant="body1">
                {stats?.lastInspectionAt
                  ? formatRelativeRu(stats.lastInspectionAt)
                  : '—'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Статус по последнему показанию
              </Typography>
              <Typography
                variant="body1"
                color={stats?.lastHasDeviation ? 'warning.main' : 'success.main'}
              >
                {stats?.lastHasDeviation ? 'Отклонение' : 'Норма'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Показаний за 7 дней
              </Typography>
              <Typography variant="body1">{stats?.readings7d ?? 0}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Осмотров за 7 дней
              </Typography>
              <Typography variant="body1">{stats?.inspections7d ?? 0}</Typography>
            </Box>
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
}
