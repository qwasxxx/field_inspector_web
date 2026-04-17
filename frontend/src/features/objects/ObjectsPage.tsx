import AssignmentTurnedInRoundedIcon from '@mui/icons-material/AssignmentTurnedInRounded';
import { Box, Button, Stack, Typography } from '@mui/material';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreatePatrolFromObjectsModal } from '@/features/objects/CreatePatrolFromObjectsModal';
import { EquipmentDetailsModal } from '@/features/objects/EquipmentDetailsModal';
import { collectEquipmentNodesByIds } from '@/features/objects/objectTreeUtils';
import { ObjectTree } from '@/features/objects/ObjectTree';
import type { ObjectNode } from '@/features/objects/types';
import { useObjectTree } from '@/features/objects/useObjectTree';

export function ObjectsPage() {
  const navigate = useNavigate();
  const { tree, loading, error } = useObjectTree();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [detailsNode, setDetailsNode] = useState<ObjectNode | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);

  const selectedNodes = useMemo(
    () => collectEquipmentNodesByIds(tree, selectedIds),
    [tree, selectedIds],
  );

  const onToggleSelect = useCallback((id: string, selected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (selected) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const handleCreated = useCallback(
    (taskId: string) => {
      setSelectedIds(new Set());
      navigate(`/tasks/${taskId}`);
    },
    [navigate],
  );

  return (
    <Box sx={{ width: '100%', maxWidth: 960 }}>
      <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
        Объекты
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Выберите оборудование и назначьте обход: создаётся задание с маршрутом для мобильного приложения.
        Список всех заданий — в разделе «Задания».
      </Typography>

      <Stack direction="row" spacing={2} sx={{ mb: 2 }} alignItems="center">
        <Button
          variant="contained"
          startIcon={<AssignmentTurnedInRoundedIcon />}
          disabled={selectedIds.size === 0}
          onClick={() => setAssignOpen(true)}
        >
          Назначить обход
        </Button>
        {selectedIds.size > 0 ? (
          <Typography variant="body2" color="text.secondary">
            Выбрано: {selectedIds.size}
          </Typography>
        ) : null}
      </Stack>

      <ObjectTree
        tree={tree}
        loading={loading}
        error={error}
        selectedIds={selectedIds}
        onToggleSelect={onToggleSelect}
        onEquipmentClick={setDetailsNode}
      />

      <EquipmentDetailsModal
        node={detailsNode}
        open={Boolean(detailsNode)}
        onClose={() => setDetailsNode(null)}
      />

      <CreatePatrolFromObjectsModal
        open={assignOpen}
        selectedNodes={selectedNodes}
        onClose={() => setAssignOpen(false)}
        onCreated={handleCreated}
      />
    </Box>
  );
}
