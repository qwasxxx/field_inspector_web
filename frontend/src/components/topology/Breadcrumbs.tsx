import { Breadcrumbs as MuiBreadcrumbs, Link, Typography } from '@mui/material';
import type { EquipmentNodeRow } from '@/types/topology';

export type BreadcrumbsProps = {
  chain: EquipmentNodeRow[];
  onCrumbClick: (nodeId: string | null) => void;
};

export function TopologyBreadcrumbs({ chain, onCrumbClick }: BreadcrumbsProps) {
  return (
    <MuiBreadcrumbs separator="›" sx={{ mb: 2, flexWrap: 'wrap' }}>
      <Link
        component="button"
        type="button"
        underline="hover"
        color="inherit"
        onClick={() => onCrumbClick(null)}
        sx={{ cursor: 'pointer' }}
      >
        РМК
      </Link>
      {chain.map((n, i) => {
        const isLast = i === chain.length - 1;
        if (isLast) {
          return (
            <Typography key={n.id} color="text.primary" fontWeight={600}>
              {n.name}
            </Typography>
          );
        }
        return (
          <Link
            key={n.id}
            component="button"
            type="button"
            underline="hover"
            color="inherit"
            onClick={() => onCrumbClick(n.id)}
            sx={{ cursor: 'pointer' }}
          >
            {n.name}
          </Link>
        );
      })}
    </MuiBreadcrumbs>
  );
}

/** Кнопка «назад» — переход к родителю */
export function BackToParentButton({
  parentId,
  onNavigate,
}: {
  parentId: string | null;
  onNavigate: (nodeId: string | null) => void;
}) {
  if (parentId === null) return null;
  return (
    <Typography component="span" sx={{ mr: 2 }}>
      <Link
        component="button"
        type="button"
        onClick={() => onNavigate(parentId)}
        sx={{ cursor: 'pointer' }}
      >
        ← Назад
      </Link>
    </Typography>
  );
}
