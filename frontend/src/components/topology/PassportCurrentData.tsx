import {
  Alert,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import { useEffect, useState } from 'react';
import { getSupabaseClient, isSupabaseConfigured } from '@/shared/lib/supabase/client';
import { fetchLatestReading } from '@/hooks/useEquipmentReadings';
import type { EquipmentNodeRow, EquipmentReadingRow } from '@/types/topology';
import { labelForParam } from '@/components/topology/paramLabels';

function normStatus(
  key: string,
  value: number,
  norms: EquipmentNodeRow['param_norms'],
): 'ok' | 'bad' | 'neutral' {
  const n = norms[key];
  if (!n) return 'neutral';
  if (value < n.min || value > n.max) return 'bad';
  return 'ok';
}

export type PassportCurrentDataProps = {
  node: EquipmentNodeRow;
};

export function PassportCurrentData({ node }: PassportCurrentDataProps) {
  const [reading, setReading] = useState<EquipmentReadingRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [inspectionLine, setInspectionLine] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      const r = await fetchLatestReading(node.id);
      if (cancelled) return;
      setReading(r);
      setLoading(false);

      if (!isSupabaseConfigured()) {
        setInspectionLine(null);
        return;
      }
      const supabase = getSupabaseClient();
      let report: {
        task_id: string | null;
        created_at: string;
      } | null = null;
      if (node.code) {
        const a = await supabase
          .from('inspection_reports')
          .select('task_id, created_at, equipment_id')
          .eq('equipment_id', node.code)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!a.error && a.data) {
          report = a.data as { task_id: string | null; created_at: string };
        }
      }
      if (!report) {
        const b = await supabase
          .from('inspection_reports')
          .select('task_id, created_at')
          .eq('equipment_id', node.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!b.error && b.data) {
          report = b.data as { task_id: string | null; created_at: string };
        }
      }
      if (!report?.task_id) {
        setInspectionLine(null);
        return;
      }
      const asg = await supabase
        .from('inspection_task_assignments')
        .select('worker_user_id')
        .eq('task_id', report.task_id)
        .maybeSingle();
      const wid = (asg.data as { worker_user_id?: string } | null)?.worker_user_id;
      let workerName = '';
      if (wid) {
        const prof = await supabase
          .from('profiles')
          .select('full_name, username')
          .eq('id', wid)
          .maybeSingle();
        const p = prof.data as { full_name?: string | null; username?: string | null } | null;
        workerName = p?.full_name ?? p?.username ?? '';
      }
      const d = new Date(report.created_at).toLocaleString('ru-RU');
      setInspectionLine(
        workerName ? `Последний осмотр: ${d}, ${workerName}` : `Последний осмотр: ${d}`,
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [node]);

  if (loading) {
    return <Skeleton variant="rounded" height={200} />;
  }

  if (!reading) {
    return (
      <Typography color="text.secondary">Нет записей измерений.</Typography>
    );
  }

  const entries = Object.entries(reading.values).filter(
    ([, v]) => typeof v === 'number' || typeof v === 'string',
  );

  return (
    <Stack spacing={2}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Параметр</TableCell>
            <TableCell align="right">Значение</TableCell>
            <TableCell>Статус</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {entries.map(([key, raw]) => {
            const num = typeof raw === 'number' ? raw : Number(raw);
            const st =
              typeof num === 'number' && !Number.isNaN(num)
                ? normStatus(key, num, node.param_norms)
                : 'neutral';
            return (
              <TableRow key={key}>
                <TableCell>{labelForParam(key)}</TableCell>
                <TableCell align="right">{String(raw)}</TableCell>
                <TableCell>
                  {st === 'bad' ? (
                    <WarningAmberRoundedIcon color="error" fontSize="small" />
                  ) : st === 'ok' ? (
                    <Typography variant="caption" color="success.main">
                      в норме
                    </Typography>
                  ) : (
                    '—'
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {inspectionLine ? (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          {inspectionLine}
        </Alert>
      ) : null}
    </Stack>
  );
}
