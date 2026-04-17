import '@xyflow/react/dist/style.css';

import { Box, Skeleton, Typography } from '@mui/material';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Background,
  Controls,
  Handle,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
  useEdgesState,
  useNodesState,
} from '@xyflow/react';
import type {
  EquipmentConnectionRow,
  EquipmentNodeRow,
  EquipmentReadingRow,
  ReadingStatusTone,
} from '@/types/topology';
import { fetchLatestReadingsMap } from '@/hooks/useEquipmentReadings';
import { NodeCard } from '@/components/topology/NodeCard';
import { toneFromReading } from '@/components/topology/topologyStatus';
import { updateNodePosition } from '@/hooks/useTopologyNodes';

const COL_POWER = '#b45309';
const COL_CONTROL = '#2563eb';
const COL_SIGNAL = '#6b7280';

function edgeColor(t: string): string {
  if (t === 'control') return COL_CONTROL;
  if (t === 'signal') return COL_SIGNAL;
  return COL_POWER;
}

export type SchemaViewProps = {
  workshopId: string;
  equipmentNodes: EquipmentNodeRow[];
  connections: EquipmentConnectionRow[];
  loading: boolean;
  onPickEquipment: (node: EquipmentNodeRow) => void;
};

type SchemaNodeData = {
  node: EquipmentNodeRow;
  tone: ReadingStatusTone;
  pulsing: boolean;
  onPickEquipment: (node: EquipmentNodeRow) => void;
};

function SchemaRfNode({ data }: NodeProps) {
  const d = data as SchemaNodeData;
  return (
    <>
      <Handle type="target" position={Position.Top} />
      <NodeCard
        node={d.node}
        tone={d.tone}
        variant="schema"
        pulsing={d.pulsing}
        onClick={() => d.onPickEquipment(d.node)}
      />
      <Handle type="source" position={Position.Bottom} />
    </>
  );
}

const nodeTypes = { schemaRf: memo(SchemaRfNode) };

const GRID_COLS = 4;
const GAP = 120;

export function SchemaView({
  workshopId,
  equipmentNodes,
  connections,
  loading,
  onPickEquipment,
}: SchemaViewProps) {
  const [readingsMap, setReadingsMap] = useState(
    () => new Map<string, EquipmentReadingRow>(),
  );

  useEffect(() => {
    void (async () => {
      const res = await fetchLatestReadingsMap(equipmentNodes.map((n) => n.id));
      setReadingsMap(res);
    })();
  }, [equipmentNodes, workshopId]);

  const initialNodes = useMemo(() => {
    return equipmentNodes.map((node, idx) => {
      const reading = readingsMap.get(node.id);
      const tone = toneFromReading(reading, node.param_norms);
      const pulsing = Boolean(reading?.has_deviation);
      let x = node.pos_x ?? 0;
      let y = node.pos_y ?? 0;
      if (node.pos_x == null || node.pos_y == null) {
        const col = idx % GRID_COLS;
        const row = Math.floor(idx / GRID_COLS);
        x = col * GAP;
        y = row * 100;
      }
      return {
        id: node.id,
        type: 'schemaRf',
        position: { x, y },
        data: {
          node,
          tone,
          pulsing,
          onPickEquipment,
        } as SchemaNodeData,
        draggable: true,
      } satisfies Node;
    });
  }, [equipmentNodes, onPickEquipment, readingsMap]);

  const initialEdges = useMemo<Edge[]>(() => {
    return connections.map((c) => ({
      id: c.id,
      source: c.from_node_id,
      target: c.to_node_id,
      label: c.label ?? '',
      style: { stroke: edgeColor(c.connection_type), strokeWidth: 2 },
      labelStyle: { fill: edgeColor(c.connection_type), fontWeight: 600, fontSize: 11 },
    }));
  }, [connections]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  const onNodeDragStop = useCallback(
    async (_e: unknown, node: Node) => {
      const err = await updateNodePosition(node.id, node.position.x, node.position.y);
      if (err.error) {
        console.error(err.error);
      }
    },
    [],
  );

  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <Skeleton variant="rounded" height={400} />
      </Box>
    );
  }

  if (equipmentNodes.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="text.secondary">Нет оборудования в цехе.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: 560 }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <Controls />
      </ReactFlow>
    </Box>
  );
}
