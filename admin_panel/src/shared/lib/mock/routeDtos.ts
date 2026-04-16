/**
 * DTO с бэкенда (имитация). Маппится в доменные сущности через RouteMapper.
 */
export type ChecklistItemDto = {
  id: string;
  label: string;
  type: 'boolean' | 'number' | 'text';
};

export type CheckpointDto = {
  id: string;
  equipmentId: string;
  checklist: ChecklistItemDto[];
};

export type RouteDto = {
  id: string;
  name: string;
  checkpoints: CheckpointDto[];
};
