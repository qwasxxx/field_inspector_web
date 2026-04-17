import '@xyflow/react/dist/style.css';

import { Box, Skeleton, Typography } from '@mui/material';
import { memo, useEffect, useMemo, useState } from 'react';
import {
  Background,
  Controls,
  Handle,
  Position,
  ReactFlow,
  type Node,
  type NodeProps,
  useEdgesState,
  useNodesState,
} from '@xyflow/react';
import type { EquipmentNodeRow, EquipmentReadingRow, ReadingStatusTone } from '@/types/topology';
import { fetchLatestReadingsMap } from '@/hooks/useEquipmentReadings';
import { buildVirtualRootEdges, layoutTreeNodes, VIRTUAL_ROOT } from '@/components/topology/layoutDagre';
import { NodeCard } from '@/components/topology/NodeCard';
import { toneFromReading } from '@/components/topology/topologyStatus';

export type TreeViewProps = {
  childrenNodes: EquipmentNodeRow[];
  loading: boolean;
  onEnter: (node: EquipmentNodeRow) => void;
  onPickEquipment: (node: EquipmentNodeRow) => void;
};

type TreeNodeData = {
  node: EquipmentNodeRow;
  tone: ReadingStatusTone;
  onEnter: (node: EquipmentNodeRow) => void;
  onPickEquipment: (node: EquipmentNodeRow) => void;
};

function HiddenRoot() {
  return <div style={{ width: 1, height: 1 }} />;
}

function TreeRfNode({ data }: NodeProps) {
  const d = data as TreeNodeData;
  const handleClick = () => {
    if (d.node.node_type === 'equipment') d.onPickEquipment(d.node);
    else d.onEnter(d.node);
  };
  return (
    <>
      <Handle type="target" position={Position.Top} />
      <NodeCard
        node={d.node}
        tone={d.tone}
        variant="tree"
        onClick={handleClick}
      />
      <Handle type="source" position={Position.Bottom} />
    </>
  );
}

const nodeTypes = { treeRf: memo(TreeRfNode), hiddenRoot: memo(HiddenRoot) };

function buildFlowState(
  childrenNodes: EquipmentNodeRow[],
  readingsMap: Map<string, EquipmentReadingRow>,
  onEnter: (node: EquipmentNodeRow) => void,
  onPickEquipment: (node: EquipmentNodeRow) => void,
): { nodes: Node[]; edges: import('@xyflow/react').Edge[] } {
  const { rootId, edges: rootEdges } = buildVirtualRootEdges(
    childrenNodes.map((c) => c.id),
  );
  const flowNodes: Node[] = [
    {
      id: rootId,
      type: 'hiddenRoot',
      position: { x: 0, y: 0 },
      data: {},
      draggable: false,
      selectable: false,
    },
    ...childrenNodes.map((node) => {
      const reading =
        node.node_type === 'equipment' ? readingsMap.get(node.id) : undefined;
      const tone = toneFromReading(reading, node.param_norms);
      return {
        id: node.id,
        type: 'treeRf',
        position: { x: 0, y: 0 },
        data: {
          node,
          tone,
          onEnter,
          onPickEquipment,
        } as TreeNodeData,
        draggable: false,
      } satisfies Node;
    }),
  ];
  const laid = layoutTreeNodes(flowNodes, rootEdges);
  const rootLaid = laid.find((n) => n.id === VIRTUAL_ROOT);
  const offsetY = rootLaid ? rootLaid.position.y + 80 : 0;
  const shifted = laid.map((n) => {
    const pos = { x: n.position.x, y: n.position.y - offsetY };
    if (n.id === VIRTUAL_ROOT) {
      return {
        ...n,
        type: 'hiddenRoot',
        position: pos,
        style: { opacity: 0, width: 1, height: 1, pointerEvents: 'none' as const },
      };
    }
    return { ...n, position: pos };
  });
  return { nodes: shifted, edges: rootEdges };
}

export function TreeView({
  childrenNodes,
  loading,
  onEnter,
  onPickEquipment,
}: TreeViewProps) {
  const [readingsMap, setReadingsMap] = useState<Map<string, EquipmentReadingRow>>(
    () => new Map(),
  );

  useEffect(() => {
    const ids = childrenNodes
      .filter((n) => n.node_type === 'equipment')
      .map((n) => n.id);
    void (async () => {
      const m = await fetchLatestReadingsMap(ids);
      setReadingsMap(m);
    })();
  }, [childrenNodes]);

  const flow = useMemo(
    () => buildFlowState(childrenNodes, readingsMap, onEnter, onPickEquipment),
    [childrenNodes, readingsMap, onEnter, onPickEquipment],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(flow.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flow.edges);

  useEffect(() => {
    const next = buildFlowState(childrenNodes, readingsMap, onEnter, onPickEquipment);
    setNodes(next.nodes);
    setEdges(next.edges);
  }, [childrenNodes, readingsMap, onEnter, onPickEquipment, setEdges, setNodes]);

  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <Skeleton variant="rounded" height={400} />
      </Box>
    );
  }

  if (childrenNodes.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary" gutterBottom>
          Нет дочерних объектов
        </Typography>
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
