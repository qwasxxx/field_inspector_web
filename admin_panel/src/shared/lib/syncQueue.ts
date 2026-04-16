import { readJson, writeJson } from '@/shared/lib/localStorageJson';

const QUEUE_KEY = 'fi_sync_queue';

export type SyncQueueItem = {
  id: string;
  createdAt: string;
  kind: 'checkpoint_complete' | 'reading' | 'photo_mock';
  payload: Record<string, unknown>;
};

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export class SyncQueue {
  static enqueue(
    item: Omit<SyncQueueItem, 'id' | 'createdAt'>,
  ): SyncQueueItem {
    const full: SyncQueueItem = {
      ...item,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    const list = readJson<SyncQueueItem[]>(QUEUE_KEY, []);
    list.push(full);
    writeJson(QUEUE_KEY, list);
    return full;
  }

  static list(): SyncQueueItem[] {
    return readJson<SyncQueueItem[]>(QUEUE_KEY, []);
  }

  static clear(): void {
    localStorage.removeItem(QUEUE_KEY);
  }
}
