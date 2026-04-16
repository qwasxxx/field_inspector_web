import type { Route, RouteRunStatus } from '@/entities/route/model/types';

export function getRouteRunStatus(
  route: Route,
  completedIds: string[],
): RouteRunStatus {
  if (route.checkpoints.length === 0) return 'completed';
  const set = new Set(completedIds);
  const allDone = route.checkpoints.every((c) => set.has(c.id));
  if (allDone) return 'completed';
  if (completedIds.length > 0) return 'in_progress';
  return 'not_started';
}

export function valueKey(
  routeId: string,
  checkpointId: string,
  itemId: string,
): string {
  return `${routeId}:${checkpointId}:${itemId}`;
}
