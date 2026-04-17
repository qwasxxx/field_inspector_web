import type { EquipmentNodeRow, EquipmentNodeType } from '@/types/topology';

export type { EquipmentNodeType as ObjectNodeType };

/** Узел дерева «Объекты» (из equipment_nodes). */
export type ObjectNode = {
  id: string;
  name: string;
  type: EquipmentNodeType;
  code?: string | null;
  equipmentType?: string | null;
  /** Исходная строка БД (паспорт, нормы и т.д. в модалке). */
  sourceRow: EquipmentNodeRow;
  children?: ObjectNode[];
};
