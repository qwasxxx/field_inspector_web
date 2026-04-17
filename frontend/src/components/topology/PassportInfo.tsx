import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import type { EquipmentNodeRow } from '@/types/topology';
import { labelForParam } from '@/components/topology/paramLabels';

export type PassportInfoProps = {
  node: EquipmentNodeRow;
};

export function PassportInfo({ node }: PassportInfoProps) {
  const passport = node.passport ?? {};
  const equipmentType =
    (typeof passport.equipment_type === 'string' && passport.equipment_type) ||
    (node.node_type === 'equipment' ? 'Оборудование' : node.node_type);

  const extraKeys = Object.keys(passport).filter(
    (k) =>
      ![
        'equipment_type',
        'manufacturer',
        'last_maintenance',
        'next_maintenance',
      ].includes(k),
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '160px 1fr',
          gap: 1,
          alignItems: 'start',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Код объекта
        </Typography>
        <Typography variant="body2">{node.code ?? '—'}</Typography>

        <Typography variant="body2" color="text.secondary">
          Тип оборудования
        </Typography>
        <Typography variant="body2">{equipmentType}</Typography>

        <Typography variant="body2" color="text.secondary">
          Производитель
        </Typography>
        <Typography variant="body2">
          {typeof passport.manufacturer === 'string' ? passport.manufacturer : '—'}
        </Typography>

        <Typography variant="body2" color="text.secondary">
          Дата последнего ТО
        </Typography>
        <Typography variant="body2">
          {typeof passport.last_maintenance === 'string'
            ? passport.last_maintenance
            : '—'}
        </Typography>

        <Typography variant="body2" color="text.secondary">
          Следующее ТО
        </Typography>
        <Typography variant="body2">
          {typeof passport.next_maintenance === 'string'
            ? passport.next_maintenance
            : '—'}
        </Typography>
      </Box>

      {extraKeys.length > 0 ? (
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Дополнительно
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '160px 1fr',
              gap: 1,
            }}
          >
            {extraKeys.map((k) => (
              <Box key={k} sx={{ display: 'contents' }}>
                <Typography variant="caption" color="text.secondary">
                  {k}
                </Typography>
                <Typography variant="body2">
                  {String((passport as Record<string, unknown>)[k] ?? '')}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      ) : null}

      <Box>
        <Typography variant="subtitle2" gutterBottom>
          Допустимые диапазоны
        </Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Параметр</TableCell>
              <TableCell align="right">Min</TableCell>
              <TableCell align="right">Max</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.entries(node.param_norms ?? {}).map(([k, v]) => (
              <TableRow key={k}>
                <TableCell>{labelForParam(k)}</TableCell>
                <TableCell align="right">{v.min}</TableCell>
                <TableCell align="right">{v.max}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {Object.keys(node.param_norms ?? {}).length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Не заданы
          </Typography>
        ) : null}
      </Box>
    </Box>
  );
}
