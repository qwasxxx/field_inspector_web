import {
  Alert,
  Box,
  Button,
  Stack,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { EquipmentNodeRow } from '@/types/topology';
import {
  fetchAncestorChain,
  fetchNodeById,
  useChildrenNodes,
  useConnections,
} from '@/hooks/useTopologyNodes';
import { isSupabaseConfigured } from '@/shared/lib/supabase/client';
import { TopologyBreadcrumbs, BackToParentButton } from '@/components/topology/Breadcrumbs';
import { TreeView } from '@/components/topology/TreeView';
import { SchemaView } from '@/components/topology/SchemaView';
import { PassportPanel } from '@/components/topology/PassportPanel';
import { SeedButton } from '@/components/topology/SeedButton';

export function TopologyPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const nodeId = searchParams.get('node');
  const [chain, setChain] = useState<EquipmentNodeRow[]>([]);
  const [contextNode, setContextNode] = useState<EquipmentNodeRow | null>(null);
  const [passportNode, setPassportNode] = useState<EquipmentNodeRow | null>(null);

  const parentIdForChildren = nodeId;
  const { data: children, loading, error, reload } = useChildrenNodes(
    parentIdForChildren,
  );

  const { data: connections, loading: connLoading } = useConnections(
    contextNode?.node_type === 'workshop' ? contextNode.id : null,
  );

  useEffect(() => {
    void (async () => {
      if (!nodeId) {
        setChain([]);
        setContextNode(null);
        return;
      }
      const c = await fetchAncestorChain(nodeId);
      setChain(c);
      const cur = await fetchNodeById(nodeId);
      setContextNode(cur);
    })();
  }, [nodeId]);

  const navigateTo = useCallback(
    (id: string | null) => {
      if (id === null) {
        setSearchParams({});
        return;
      }
      void (async () => {
        const n = await fetchNodeById(id);
        setSearchParams({
          node: id,
          level: n ? String(n.level) : '1',
        });
      })();
    },
    [setSearchParams],
  );

  const handleEnter = useCallback(
    (n: EquipmentNodeRow) => {
      setSearchParams({ node: n.id, level: String(n.level) });
    },
    [setSearchParams],
  );

  const handlePickEquipment = useCallback((n: EquipmentNodeRow) => {
    setPassportNode(n);
  }, []);

  const isWorkshop = contextNode?.node_type === 'workshop';

  const equipmentNodes = useMemo(
    () => children.filter((c) => c.node_type === 'equipment'),
    [children],
  );

  const parentForBack = contextNode?.parent_id ?? null;

  if (!isSupabaseConfigured()) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="warning">
          Настройте Supabase в <code>frontend/.env.local</code> для раздела «Схема объектов».
        </Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: 'calc(100dvh - 120px)',
        width: '100%',
      }}
    >
      <Stack direction="row" alignItems="center" flexWrap="wrap" sx={{ mb: 1 }}>
        <BackToParentButton parentId={parentForBack} onNavigate={navigateTo} />
        <Typography variant="h4" component="h1" fontWeight={700}>
          Схема объектов
        </Typography>
      </Stack>

      <SeedButton onSeeded={() => void reload()} />

      <TopologyBreadcrumbs chain={chain} onCrumbClick={navigateTo} />

      {error ? (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={() => void reload()}>
              Повторить
            </Button>
          }
        >
          {error}
        </Alert>
      ) : null}

      <Box sx={{ flex: 1, minHeight: 400, position: 'relative' }}>
        {isWorkshop ? (
          <SchemaView
            workshopId={contextNode!.id}
            equipmentNodes={equipmentNodes}
            connections={connections}
            loading={loading || connLoading}
            onPickEquipment={handlePickEquipment}
          />
        ) : (
          <TreeView
            childrenNodes={children}
            loading={loading}
            onEnter={handleEnter}
            onPickEquipment={handlePickEquipment}
          />
        )}
      </Box>

      <PassportPanel
        node={passportNode}
        open={Boolean(passportNode)}
        onClose={() => setPassportNode(null)}
      />
    </Box>
  );
}
