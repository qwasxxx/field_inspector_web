import { Box, Typography } from '@mui/material';
import { Building2, Cpu, Factory, Layers, MapPin } from 'lucide-react';
import type { EquipmentNodeRow, ReadingStatusTone } from '@/types/topology';

const ACCENT = '#b45309';

function iconFor(nodeType: EquipmentNodeRow['node_type']) {
  const size = 20;
  switch (nodeType) {
    case 'plant':
      return <Building2 size={size} color={ACCENT} />;
    case 'site':
      return <MapPin size={size} color={ACCENT} />;
    case 'workshop':
      return <Factory size={size} color={ACCENT} />;
    case 'section':
      return <Layers size={size} color={ACCENT} />;
    case 'equipment':
    default:
      return <Cpu size={size} color={ACCENT} />;
  }
}

function dotColor(tone: ReadingStatusTone): string {
  switch (tone) {
    case 'ok':
      return '#16a34a';
    case 'minor':
      return '#ca8a04';
    case 'critical':
      return '#dc2626';
    default:
      return '#9ca3af';
  }
}

export type NodeCardVariant = 'tree' | 'schema';

export type NodeCardProps = {
  node: EquipmentNodeRow;
  tone: ReadingStatusTone;
  variant: NodeCardVariant;
  /** Tooltip / hover (опционально) */
  lastReadingAt?: string | null;
  lastInspectionAt?: string | null;
  pulsing?: boolean;
  onClick?: () => void;
};

export function NodeCard({
  node,
  tone,
  variant,
  lastReadingAt,
  lastInspectionAt,
  pulsing,
  onClick,
}: NodeCardProps) {
  const w = variant === 'tree' ? 180 : 140;
  const h = variant === 'tree' ? 60 : 70;
  const border =
    variant === 'schema'
      ? tone === 'critical' || pulsing
        ? '2px solid #dc2626'
        : tone === 'ok'
          ? '2px solid #16a34a'
          : tone === 'minor'
            ? '2px solid #ca8a04'
            : '2px solid #9ca3af'
      : '1px solid';
  const borderColorSx =
    variant === 'tree' ? { borderColor: 'divider' } : { border: border };

  return (
    <Box
      onClick={onClick}
      sx={{
        width: w,
        height: h,
        borderRadius: 2,
        px: 1,
        py: 0.5,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        bgcolor: 'background.paper',
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: 1,
        ...borderColorSx,
        ...(pulsing && variant === 'schema'
          ? {
              animation: 'pulseBorder 1.5s ease-in-out infinite',
              '@keyframes pulseBorder': {
                '0%, 100%': { boxShadow: '0 0 0 0 rgba(220, 38, 38, 0.6)' },
                '50%': { boxShadow: '0 0 0 6px rgba(220, 38, 38, 0)' },
              },
            }
          : {}),
      }}
      title={
        [lastReadingAt && `Последнее измерение: ${lastReadingAt}`, lastInspectionAt && `Осмотр: ${lastInspectionAt}`]
          .filter(Boolean)
          .join('\n') || undefined
      }
    >
      {iconFor(node.node_type)}
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography variant="body2" fontWeight={700} noWrap>
          {node.name}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap>
          {node.code ?? '—'}
        </Typography>
      </Box>
      <Box
        sx={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          bgcolor: dotColor(tone),
          flexShrink: 0,
        }}
      />
    </Box>
  );
}
