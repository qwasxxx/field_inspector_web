import dagre from '@dagrejs/dagre';
import type { Edge, Node } from '@xyflow/react';

const TREE_W = 180;
const TREE_H = 60;

export const VIRTUAL_ROOT = '__topology_root__';

/** Раскладка одного уровня иерархии: виртуальный корень сверху, дети ниже. */
export function layoutTreeNodes(flowNodes: Node[], flowEdges: Edge[]): Node[] {
  if (flowNodes.length === 0) return [];
  const g = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', ranksep: 80, nodesep: 40 });
  flowNodes.forEach((n) => {
    const isV = n.id === VIRTUAL_ROOT;
    g.setNode(n.id, { width: isV ? 1 : TREE_W, height: isV ? 1 : TREE_H });
  });
  flowEdges.forEach((e) => g.setEdge(e.source, e.target));
  dagre.layout(g);
  return flowNodes.map((n) => {
    const pos = g.node(n.id);
    const w = n.id === VIRTUAL_ROOT ? 1 : TREE_W;
    const h = n.id === VIRTUAL_ROOT ? 1 : TREE_H;
    return {
      ...n,
      position: {
        x: pos.x - w / 2,
        y: pos.y - h / 2,
      },
    };
  });
}

export function buildVirtualRootEdges(childIds: string[]): { rootId: string; edges: Edge[] } {
  return {
    rootId: VIRTUAL_ROOT,
    edges: childIds.map((id) => ({
      id: `e-root-${id}`,
      source: VIRTUAL_ROOT,
      target: id,
      type: 'default',
    })),
  };
}

export { TREE_W, TREE_H };
