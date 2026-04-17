import type { ObjectNode } from '@/features/objects/types';

/** Все узлы-оборудование из дерева, чьи id входят в множество (порядок обхода дерева). */
export function collectEquipmentNodesByIds(
  tree: ObjectNode[],
  ids: Set<string>,
): ObjectNode[] {
  const out: ObjectNode[] = [];
  function walk(nodes: ObjectNode[]) {
    for (const n of nodes) {
      if (n.type === 'equipment' && ids.has(n.id)) {
        out.push(n);
      }
      if (n.children?.length) walk(n.children);
    }
  }
  walk(tree);
  return out;
}
