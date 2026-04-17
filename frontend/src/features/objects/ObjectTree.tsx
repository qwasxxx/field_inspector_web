import { Alert, CircularProgress, List, Paper, Typography } from '@mui/material';
import { ObjectNodeItem } from '@/features/objects/ObjectNodeItem';
import type { ObjectNode } from '@/features/objects/types';

export type ObjectTreeProps = {
  tree: ObjectNode[];
  loading?: boolean;
  error?: string | null;
  selectedIds: Set<string>;
  onToggleSelect: (id: string, selected: boolean) => void;
  onEquipmentClick: (node: ObjectNode) => void;
};

export function ObjectTree({
  tree,
  loading,
  error,
  selectedIds,
  onToggleSelect,
  onEquipmentClick,
}: ObjectTreeProps) {
  if (loading) {
    return (
      <Paper variant="outlined" sx={{ borderRadius: 2, p: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress size={32} />
      </Paper>
    );
  }

  if (error) {
    return <Alert severity="warning">{error}</Alert>;
  }

  if (tree.length === 0) {
    return (
      <Paper variant="outlined" sx={{ borderRadius: 2, p: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Нет активных узлов в equipment_nodes. Проверьте данные в Supabase и политики RLS (SELECT для
          authenticated).
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <List component="div" disablePadding>
        {tree.map((node) => (
          <ObjectNodeItem
            key={node.id}
            node={node}
            depth={0}
            expandedDefault
            selectedIds={selectedIds}
            onToggleSelect={onToggleSelect}
            onEquipmentClick={onEquipmentClick}
          />
        ))}
      </List>
    </Paper>
  );
}
