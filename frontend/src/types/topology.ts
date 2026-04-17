/** Тип узла оборудования / площадки (Supabase equipment_nodes.node_type) */
export type EquipmentNodeType =
  | 'plant'
  | 'site'
  | 'workshop'
  | 'section'
  | 'equipment';

/** Строка equipment_nodes */
export type EquipmentNodeRow = {
  id: string;
  parent_id: string | null;
  name: string;
  code: string | null;
  node_type: EquipmentNodeType;
  equipment_type: string | null;
  level: number;
  pos_x: number | null;
  pos_y: number | null;
  passport: Record<string, unknown>;
  /** Нормы из JSONB; ключи — параметры показаний. */
  param_norms: Record<string, { min: number; max: number }>;
  meta: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

/** Строка equipment_connections */
export type EquipmentConnectionRow = {
  id: string;
  from_node_id: string;
  to_node_id: string;
  connection_type: string;
  label: string | null;
  workshop_id: string | null;
};

/** Строка equipment_readings */
export type EquipmentReadingRow = {
  id: string;
  equipment_id: string;
  recorded_at: string;
  source: string;
  recorded_by: string | null;
  values: Record<string, number | string | boolean | null>;
  has_deviation: boolean;
  deviation_params: string[] | null;
  inspection_result_id: string | null;
};

export type ReadingStatusTone = 'ok' | 'minor' | 'critical' | 'none';

export type TopologySearchParams = {
  node: string | null;
  level: number | null;
};
