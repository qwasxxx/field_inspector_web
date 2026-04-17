import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import HighlightOffRoundedIcon from '@mui/icons-material/HighlightOffRounded';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Typography,
} from '@mui/material';
import type { ReactNode } from 'react';

/** Русские подписи для ключей замеров (как в мобильном приложении). */
const MEASUREMENT_LABEL_RU: Record<string, string> = {
  pressure: 'Давление',
  vibration: 'Вибрация',
  temperature: 'Температура',
  temperature_oil: 'Температура масла',
  temperature_winding: 'Температура обмотки',
  voltage_l1: 'Напряжение L1',
  voltage_l2: 'Напряжение L2',
  voltage_l3: 'Напряжение L3',
  current_a: 'Ток, А',
  load_percent: 'Загрузка, %',
  rpm: 'Обороты',
  flow_m3h: 'Расход, м³/ч',
};

/** Подписи пунктов чек-листа по ключу (если в данных только англ. label). */
const CHECKLIST_KEY_HINT_RU: Record<string, string> = {
  visual_ok: 'Внешнее состояние в норме',
  no_leaks: 'Утечек не обнаружено',
  no_noise: 'Нет постороннего шума',
  access_clear: 'Подход к оборудованию свободен',
};

export function measurementLabelRu(key: string): string {
  return MEASUREMENT_LABEL_RU[key] ?? key.replace(/_/g, ' ');
}

export function defectPriorityRu(p: string | null | undefined): string {
  if (!p) return '—';
  const m: Record<string, string> = {
    low: 'Низкий',
    medium: 'Средний',
    high: 'Высокий',
  };
  return m[p.toLowerCase()] ?? p;
}

type ChecklistItem = {
  key?: string;
  label?: string;
  checked?: boolean;
};

function checklistItemTitle(item: ChecklistItem): string {
  const key = item.key ?? '';
  const fromKey = key ? CHECKLIST_KEY_HINT_RU[key] : undefined;
  if (fromKey) return fromKey;
  if (typeof item.label === 'string' && item.label.trim()) return item.label.trim();
  return key || 'Пункт';
}

export function ReportChecklistView({ checklist }: { checklist: unknown }) {
  if (checklist == null) {
    return (
      <Typography variant="body2" color="text.secondary">
        Нет данных
      </Typography>
    );
  }
  if (!Array.isArray(checklist)) {
    return (
      <Typography variant="body2" color="text.secondary">
        Нет данных в ожидаемом формате
      </Typography>
    );
  }
  if (checklist.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        Пункты не заполнены
      </Typography>
    );
  }

  return (
    <Box>
      {checklist.map((raw, i) => {
        const item = raw as ChecklistItem;
        const title = checklistItemTitle(item);
        const ok = Boolean(item.checked);
        return (
          <Box
            key={i}
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1.25,
              py: 0.75,
              borderBottom: '1px solid',
              borderColor: 'divider',
              '&:last-of-type': { borderBottom: 'none' },
            }}
          >
            <Box sx={{ pt: 0.25, color: ok ? 'success.main' : 'text.disabled' }}>
              {ok ? (
                <CheckCircleOutlineRoundedIcon fontSize="small" aria-hidden />
              ) : (
                <HighlightOffRoundedIcon fontSize="small" aria-hidden />
              )}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" fontWeight={500}>
                {title}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {ok ? 'Выполнено' : 'Не отмечено'}
              </Typography>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

export function ReportMeasurementsView({ measurements }: { measurements: unknown }) {
  if (measurements == null) {
    return (
      <Typography variant="body2" color="text.secondary">
        Нет данных
      </Typography>
    );
  }
  if (typeof measurements !== 'object' || Array.isArray(measurements)) {
    return (
      <Typography variant="body2" color="text.secondary">
        Нет данных в ожидаемом формате
      </Typography>
    );
  }

  const entries = Object.entries(measurements as Record<string, unknown>).filter(
    ([, v]) => v !== null && v !== undefined && String(v).trim() !== '',
  );

  if (entries.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        Показания не внесены
      </Typography>
    );
  }

  return (
    <Table size="small">
      <TableBody>
        {entries.map(([key, val]) => (
          <TableRow key={key}>
            <TableCell
              component="th"
              scope="row"
              sx={{ width: '45%', fontWeight: 500, border: 0, py: 1 }}
            >
              {measurementLabelRu(key)}
            </TableCell>
            <TableCell sx={{ border: 0, py: 1 }}>{String(val)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function ReportDetailSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        {title}
      </Typography>
      {children}
    </Paper>
  );
}
