import type {
  ChecklistItem,
  ChecklistItemType,
} from '@/entities/checklist/model/types';
import type { Checkpoint, Route } from '@/entities/route/model/types';
import { valueKey } from '@/features/route/lib/routeProgress';
import {
  getRouteExecutionState,
  routeExecutionActions,
} from '@/features/route/model/routeExecutionStore';
import { SyncQueue } from '@/shared/lib/syncQueue';

function isFilled(
  value: unknown,
  type: ChecklistItemType,
  required: boolean,
): boolean {
  if (!required) {
    if (value === undefined || value === null) return true;
    if (type === 'text' && typeof value === 'string' && value.trim() === '') {
      return true;
    }
    if (type === 'number') {
      if (typeof value === 'string' && value.trim() === '') return true;
      if (value === '') return true;
    }
    if (type === 'boolean') return true;
  }
  if (value === undefined || value === null) return false;
  if (type === 'boolean') return typeof value === 'boolean';
  if (type === 'text' && typeof value === 'string' && value.trim() === '') {
    return false;
  }
  if (type === 'number') {
    if (typeof value === 'number') return !Number.isNaN(value);
    if (typeof value === 'string') {
      if (value.trim() === '') return false;
      return !Number.isNaN(Number(value.replace(',', '.')));
    }
    return false;
  }
  return true;
}

function normalizeForPayload(
  value: unknown,
  type: ChecklistItemType,
  item: ChecklistItem,
): string | number | boolean | undefined {
  const required = item.required !== false;
  if (!required) {
    if (value === undefined || value === null) return undefined;
    if (type === 'text' && typeof value === 'string' && value.trim() === '') {
      return undefined;
    }
    if (
      type === 'number' &&
      typeof value === 'string' &&
      value.trim() === ''
    ) {
      return undefined;
    }
  }
  if (type === 'number') {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      return Number(value.replace(',', '.'));
    }
  }
  if (type === 'boolean') return Boolean(value);
  return String(value);
}

export class RouteHandlers {
  static handleCheckpointComplete(route: Route, checkpoint: Checkpoint): {
    ok: boolean;
    reason?: string;
  } {
    const store = getRouteExecutionState();
    const values: Record<string, unknown> = {};

    for (const item of checkpoint.checklist) {
      const key = valueKey(route.id, checkpoint.id, item.id);
      const raw = store.checklistValues[key];
      const required = item.required !== false;
      if (!isFilled(raw, item.type, required)) {
        return {
          ok: false,
          reason: 'Заполните все обязательные поля чек-листа для этой точки.',
        };
      }
      const normalized = normalizeForPayload(raw, item.type, item);
      if (normalized !== undefined) {
        values[item.id] = normalized;
      }
    }

    routeExecutionActions.markCheckpointComplete(route.id, checkpoint.id);

    SyncQueue.enqueue({
      kind: 'checkpoint_complete',
      payload: {
        routeId: route.id,
        routeName: route.name,
        checkpointId: checkpoint.id,
        equipmentId: checkpoint.equipmentId,
        values,
      },
    });

    return { ok: true };
  }

  static handlePhotoMock(routeId: string, checkpointId: string): string {
    const photoId = routeExecutionActions.addMockPhoto(routeId, checkpointId);
    SyncQueue.enqueue({
      kind: 'photo_mock',
      payload: { routeId, checkpointId, photoId },
    });
    return photoId;
  }

  static handleReadingQueued(
    routeId: string,
    checkpointId: string,
    label: string,
    value: number,
  ): void {
    SyncQueue.enqueue({
      kind: 'reading',
      payload: { routeId, checkpointId, label, value },
    });
  }
}
