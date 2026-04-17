import { Box, Button, Checkbox, FormControlLabel, FormGroup, Skeleton, Stack, TextField, ToggleButton, ToggleButtonGroup } from '@mui/material';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import ImageRoundedIcon from '@mui/icons-material/ImageRounded';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { EquipmentNodeRow, EquipmentReadingRow } from '@/types/topology';
import { fetchLatestReading, fetchReadingsInRange } from '@/hooks/useEquipmentReadings';
import { labelForParam } from '@/components/topology/paramLabels';

type Period = '1h' | '24h' | '7d' | '30d' | 'custom';
type Granularity = 'raw' | 'hour' | 'day';

export type PassportHistoryProps = {
  node: EquipmentNodeRow;
};

export function PassportHistory({ node }: PassportHistoryProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [period, setPeriod] = useState<Period>('7d');
  const [granularity, setGranularity] = useState<Granularity>('raw');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [rows, setRows] = useState<EquipmentReadingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [keys, setKeys] = useState<string[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const range = useMemo(() => {
    const now = Date.now();
    let start = now - 7 * 24 * 60 * 60 * 1000;
    if (period === '1h') start = now - 60 * 60 * 1000;
    else if (period === '24h') start = now - 24 * 60 * 60 * 1000;
    else if (period === '7d') start = now - 7 * 24 * 60 * 60 * 1000;
    else if (period === '30d') start = now - 30 * 24 * 60 * 60 * 1000;
    else if (period === 'custom' && from && to) {
      const a = new Date(from);
      const b = new Date(to);
      if (!Number.isNaN(a.getTime()) && !Number.isNaN(b.getTime())) {
        return { fromIso: a.toISOString(), toIso: b.toISOString() };
      }
    }
    return { fromIso: new Date(start).toISOString(), toIso: new Date(now).toISOString() };
  }, [period, from, to]);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchReadingsInRange(node.id, range.fromIso, range.toIso);
    setRows(data);
    const latest = await fetchLatestReading(node.id);
    const k = latest?.values
      ? Object.keys(latest.values).filter((x) => typeof latest.values[x] === 'number')
      : [];
    setKeys(k);
    setSelected((prev) => {
      const next: Record<string, boolean> = { ...prev };
      for (const key of k) {
        if (next[key] === undefined) next[key] = true;
      }
      return next;
    });
    setLoading(false);
  }, [node.id, range.fromIso, range.toIso]);

  useEffect(() => {
    void load();
  }, [load]);

  const chartData = useMemo(() => {
    if (rows.length === 0) return [];
    const numericRows = rows.map((r) => ({
      recorded_at: r.recorded_at,
      values: r.values as Record<string, number>,
    }));
    if (granularity === 'raw') {
      return numericRows.map((r) => {
        const point: Record<string, number | string> = {
          t: r.recorded_at,
          ts: new Date(r.recorded_at).getTime(),
        };
        for (const k of keys) {
          point[k] = r.values[k] ?? NaN;
        }
        return point;
      });
    }
    const bucket = new Map<number, Record<string, number[]>>();
    for (const r of numericRows) {
      const d = new Date(r.recorded_at);
      const tk =
        granularity === 'hour'
          ? new Date(
              d.getFullYear(),
              d.getMonth(),
              d.getDate(),
              d.getHours(),
            ).getTime()
          : new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      if (!bucket.has(tk)) bucket.set(tk, {});
      const slot = bucket.get(tk)!;
      for (const [k, v] of Object.entries(r.values)) {
        if (typeof v !== 'number') continue;
        if (!slot[k]) slot[k] = [];
        slot[k].push(v);
      }
    }
    const out: Record<string, number | string>[] = [];
    for (const [ts, agg] of bucket) {
      const point: Record<string, number | string> = {
        t: new Date(ts).toISOString(),
        ts,
      };
      for (const k of keys) {
        const arr = agg[k];
        if (arr && arr.length > 0) {
          point[k] = arr.reduce((a, b) => a + b, 0) / arr.length;
        }
      }
      out.push(point);
    }
    return out.sort((a, b) => (a.ts as number) - (b.ts as number));
  }, [rows, granularity, keys]);

  const colors = ['#b45309', '#2563eb', '#16a34a', '#ca8a04', '#7c3aed', '#dc2626'];

  const exportCsv = () => {
    const header = ['recorded_at', ...keys].join(',');
    const lines = rows.map((r) => {
      const vals = keys.map((k) => {
        const v = r.values[k];
        return typeof v === 'number' ? String(v) : `"${String(v ?? '')}"`;
      });
      return [r.recorded_at, ...vals].join(',');
    });
    const blob = new Blob([`${header}\n${lines.join('\n')}`], {
      type: 'text/csv;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `readings_${node.code ?? node.id}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPng = async () => {
    if (!chartRef.current) return;
    const canvas = await html2canvas(chartRef.current);
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `chart_${node.code ?? node.id}.png`;
    a.click();
  };

  if (loading) {
    return <Skeleton variant="rounded" height={320} />;
  }

  return (
    <Stack spacing={2}>
      <ToggleButtonGroup
        size="small"
        value={period}
        exclusive
        onChange={(_, v) => v && setPeriod(v)}
      >
        <ToggleButton value="1h">1ч</ToggleButton>
        <ToggleButton value="24h">24ч</ToggleButton>
        <ToggleButton value="7d">7д</ToggleButton>
        <ToggleButton value="30d">30д</ToggleButton>
        <ToggleButton value="custom">Диапазон</ToggleButton>
      </ToggleButtonGroup>
      {period === 'custom' ? (
        <Stack direction="row" spacing={2}>
          <TextField
            label="С"
            type="datetime-local"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
          />
          <TextField
            label="По"
            type="datetime-local"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
          />
        </Stack>
      ) : null}

      <ToggleButtonGroup
        size="small"
        value={granularity}
        exclusive
        onChange={(_, v) => v && setGranularity(v)}
      >
        <ToggleButton value="raw">Исходные</ToggleButton>
        <ToggleButton value="hour">По часам</ToggleButton>
        <ToggleButton value="day">По дням</ToggleButton>
      </ToggleButtonGroup>

      <FormGroup row>
        {keys.map((k) => (
          <FormControlLabel
            key={k}
            control={
              <Checkbox
                checked={Boolean(selected[k])}
                onChange={() =>
                  setSelected((s) => ({ ...s, [k]: !s[k] }))
                }
              />
            }
            label={labelForParam(k)}
          />
        ))}
      </FormGroup>

      <Box ref={chartRef} sx={{ width: '100%', height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="t"
              tickFormatter={(v) =>
                typeof v === 'string' ? new Date(v).toLocaleString('ru-RU') : String(v)
              }
            />
            <YAxis />
            <Tooltip />
            <Legend />
            {keys.map(
              (k, i) =>
                selected[k] && (
                  <Line
                    key={k}
                    type="monotone"
                    dataKey={k}
                    stroke={colors[i % colors.length]}
                    dot={false}
                    name={labelForParam(k)}
                  />
                ),
            )}
            {(() => {
              const k0 = keys.find((k) => node.param_norms[k]);
              if (!k0) return null;
              const n = node.param_norms[k0];
              return (
                <>
                  <ReferenceLine
                    y={n.min}
                    stroke="#94a3b8"
                    strokeDasharray="4 4"
                  />
                  <ReferenceLine
                    y={n.max}
                    stroke="#94a3b8"
                    strokeDasharray="4 4"
                  />
                </>
              );
            })()}
          </LineChart>
        </ResponsiveContainer>
      </Box>

      <Stack direction="row" spacing={1}>
        <Button variant="outlined" size="small" startIcon={<DownloadRoundedIcon />} onClick={exportCsv}>
          Скачать CSV
        </Button>
        <Button variant="outlined" size="small" startIcon={<ImageRoundedIcon />} onClick={() => void exportPng()}>
          Скачать PNG
        </Button>
      </Stack>
    </Stack>
  );
}
