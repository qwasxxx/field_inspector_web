import { useSyncExternalStore } from 'react';
import { readJson, writeJson } from '@/shared/lib/localStorageJson';

const STORAGE_KEY = 'fi-route-exec';

export type RouteExecutionState = {
  checklistValues: Record<string, string | number | boolean>;
  completedCheckpointIds: Record<string, string[]>;
  photoIdsByCheckpoint: Record<string, string[]>;
  /** `${routeId}:${checkpointId}` → id шаблона или null = встроенный чек-лист маршрута */
  checkpointTemplateId: Record<string, string | null>;
};

const defaultState: RouteExecutionState = {
  checklistValues: {},
  completedCheckpointIds: {},
  photoIdsByCheckpoint: {},
  checkpointTemplateId: {},
};

function loadState(): RouteExecutionState {
  const raw = readJson<Partial<RouteExecutionState>>(STORAGE_KEY, {});
  return {
    ...defaultState,
    ...raw,
    checkpointTemplateId: raw.checkpointTemplateId ?? {},
  };
}

let state: RouteExecutionState = loadState();
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((l) => l());
}

function persist(): void {
  writeJson(STORAGE_KEY, state);
}

function setState(updater: (prev: RouteExecutionState) => RouteExecutionState): void {
  state = updater(state);
  persist();
  emit();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getRouteExecutionState(): RouteExecutionState {
  return state;
}

export function useRouteExecutionStore<T>(
  selector: (s: RouteExecutionState) => T,
): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(loadState()),
  );
}

export const routeExecutionActions = {
  setChecklistValue(key: string, value: string | number | boolean): void {
    setState((prev) => ({
      ...prev,
      checklistValues: { ...prev.checklistValues, [key]: value },
    }));
  },

  markCheckpointComplete(routeId: string, checkpointId: string): void {
    setState((prev) => {
      const list = prev.completedCheckpointIds[routeId] ?? [];
      if (list.includes(checkpointId)) return prev;
      return {
        ...prev,
        completedCheckpointIds: {
          ...prev.completedCheckpointIds,
          [routeId]: [...list, checkpointId],
        },
      };
    });
  },

  addMockPhoto(routeId: string, checkpointId: string): string {
    const key = `${routeId}:${checkpointId}`;
    const id = `mock-photo-${Date.now()}`;
    setState((prev) => {
      const prevPhotos = prev.photoIdsByCheckpoint[key] ?? [];
      return {
        ...prev,
        photoIdsByCheckpoint: {
          ...prev.photoIdsByCheckpoint,
          [key]: [...prevPhotos, id],
        },
      };
    });
    return id;
  },

  setCheckpointTemplate(
    routeId: string,
    checkpointId: string,
    templateId: string | null,
  ): void {
    const ck = `${routeId}:${checkpointId}`;
    setState((prev) => {
      const nextValues = { ...prev.checklistValues };
      for (const k of Object.keys(nextValues)) {
        if (k.startsWith(`${ck}:`)) delete nextValues[k];
      }
      return {
        ...prev,
        checklistValues: nextValues,
        checkpointTemplateId: {
          ...prev.checkpointTemplateId,
          [ck]: templateId,
        },
      };
    });
  },

  resetRouteProgress(routeId: string): void {
    setState((prev) => {
      const { [routeId]: _drop, ...restCompleted } = prev.completedCheckpointIds;
      const nextValues = { ...prev.checklistValues };
      const nextPhotos = { ...prev.photoIdsByCheckpoint };
      for (const k of Object.keys(nextValues)) {
        if (k.startsWith(`${routeId}:`)) delete nextValues[k];
      }
      for (const k of Object.keys(nextPhotos)) {
        if (k.startsWith(`${routeId}:`)) delete nextPhotos[k];
      }
      const nextTpl = { ...prev.checkpointTemplateId };
      for (const k of Object.keys(nextTpl)) {
        if (k.startsWith(`${routeId}:`)) delete nextTpl[k];
      }
      return {
        ...prev,
        completedCheckpointIds: restCompleted,
        checklistValues: nextValues,
        photoIdsByCheckpoint: nextPhotos,
        checkpointTemplateId: nextTpl,
      };
    });
  },
};
