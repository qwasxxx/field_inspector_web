import type { ObjectNode } from '@/features/objects/types';
import type { EquipmentNodeRow } from '@/types/topology';

/** Плоский список из Supabase → дерево по parent_id, дети по имени (ru). */
export function buildObjectTreeFromRows(rows: EquipmentNodeRow[]): ObjectNode[] {
  const byParent = new Map<string | null, EquipmentNodeRow[]>();
  for (const r of rows) {
    const p = r.parent_id;
    const list = byParent.get(p) ?? [];
    list.push(r);
    byParent.set(p, list);
  }
  for (const [, list] of byParent) {
    list.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  }

  function build(parentId: string | null): ObjectNode[] {
    const list = byParent.get(parentId) ?? [];
    return list.map((r) => {
      const childNodes = build(r.id);
      const node: ObjectNode = {
        id: r.id,
        name: r.name,
        type: r.node_type,
        code: r.code,
        equipmentType: r.equipment_type,
        sourceRow: r,
        children: childNodes.length > 0 ? childNodes : undefined,
      };
      return node;
    });
  }

  return build(null);
}
