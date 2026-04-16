import { useSyncExternalStore } from 'react';
import type { ChecklistTemplate } from '@/entities/checklist/checklist.types';
import {
  loadTemplates,
  saveTemplates,
} from '@/shared/lib/checklistTemplatesStorage';

let templates: ChecklistTemplate[] = loadTemplates();
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getChecklistTemplates(): ChecklistTemplate[] {
  return templates;
}

export function setChecklistTemplates(next: ChecklistTemplate[]): void {
  templates = next;
  saveTemplates(next);
  emit();
}

export function useChecklistTemplatesList(): ChecklistTemplate[] {
  return useSyncExternalStore(
    subscribe,
    () => templates,
    () => loadTemplates(),
  );
}
