import type { ChecklistItem } from '@/entities/checklist/model/types';

export type Checkpoint = {
  id: string;
  equipmentId: string;
  checklist: ChecklistItem[];
};

export type Route = {
  id: string;
  name: string;
  checkpoints: Checkpoint[];
};

export type RouteRunStatus = 'not_started' | 'in_progress' | 'completed';
