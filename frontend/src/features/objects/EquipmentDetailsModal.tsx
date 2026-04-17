import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import {
  Box,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { labelForParam } from '@/components/topology/paramLabels';
import { buildEquipmentChartPoints } from '@/features/objects/equipmentChart';
import { formatRelativeRu } from '@/features/objects/formatRelativeRu';
import type { ObjectNode } from '@/features/objects/types';
import {
  fetchEquipmentModalStats,
  fetchReadingsInRange,
  type EquipmentModalStats,
} from '@/hooks/useEquipmentReadings';
import type { EquipmentReadingRow } from '@/types/topology';

const EQUIP_TYPE_RU: Record<string, string> = {
  transformer: 'Трансформатор',
  pump: 'Насос',
  switchboard: 'Щит',
  cable: 'Кабель',
  fan: 'Вентиляция',
  valve: 'Арматура',
};

const LINE_COLORS = ['#1976d2', '#ed6c02', '#2e7d32', '#9c27b0'];

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
  const theme = useTheme();
  const [periodDays, setPeriodDays] = useState<7 | 30>(7);
  const [stats, setStats] = useState<EquipmentModalStats | null>(null);
  const [readings, setReadings] = useState<EquipmentReadingRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!node || node.type !== 'equipment') {
      setStats(null);
      setReadings([]);
      return;
    }
    setLoading(true);
    const from = new Date(
      Date.now() - periodDays * 24 * 60 * 60 * 1000,
    ).toISOString();
    const to = new Date().toISOString();
    const [s, rows] = await Promise.all([
      fetchEquipmentModalStats(node.id, periodDays),
      fetchReadingsInRange(node.id, from, to),
    ]);
    setStats(s);
    setReadings(rows);
    setLoading(false);
  }, [node, periodDays]);

  useEffect(() => {
    if (!open || !node) return;
    void load();
  }, [open, node?.id, node?.type, periodDays, load]);

  const chartModel = useMemo(
    () => buildEquipmentChartPoints(readings, 4),
    [readings],
  );

  if (!node) return null;

  const eq = node.equipmentType;
  const typeLabel =
    (eq && EQUIP_TYPE_RU[eq]) ?? (eq ? eq : 'Оборудование');

  const periodLabel = periodDays === 7 ? '7 дней' : '30 дней';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
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
        <Stack spacing={2}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Период аналитики:
            </Typography>
            <ToggleButtonGroup
              size="small"
              exclusive
              value={periodDays}
              onChange={(_, v) => {
                if (v === 7 || v === 30) setPeriodDays(v);
              }}
            >
              <ToggleButton value={7}>7 дней</ToggleButton>
              <ToggleButton value={30}>30 дней</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress size={32} />
            </Box>
          ) : (
            <>
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
                  Последняя запись осмотра
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
                  Показаний за {periodLabel}
                </Typography>
                <Typography variant="body1">{stats?.readingsInPeriod ?? 0}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Осмотров за {periodLabel}
                </Typography>
                <Typography variant="body1">{stats?.inspectionsInPeriod ?? 0}</Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                  Динамика показаний
                </Typography>
                {chartModel.data.length === 0 || chartModel.keys.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    Нет числовых показаний за выбранный период — график появится после появления
                    замеров.
                  </Typography>
                ) : (
                  <Box sx={{ width: '100%', height: 320, mt: 1 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartModel.data} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: 11 }}
                          interval="preserveStartEnd"
                        />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Legend />
                        {chartModel.keys.map((k, i) => (
                          <Line
                            key={k}
                            type="monotone"
                            dataKey={k}
                            name={labelForParam(k)}
                            stroke={LINE_COLORS[i % LINE_COLORS.length]}
                            dot={{ r: 3 }}
                            strokeWidth={2}
                            connectNulls
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                )}
              </Box>
            </>
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
