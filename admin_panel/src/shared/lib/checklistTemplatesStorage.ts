import { readJson, writeJson } from '@/shared/lib/localStorageJson';
import type { ChecklistTemplate } from '@/entities/checklist/checklist.types';

/** Ключ localStorage (как в ТЗ) */
export const CHECKLIST_TEMPLATES = 'CHECKLIST_TEMPLATES';

export function loadTemplates(): ChecklistTemplate[] {
  return readJson<ChecklistTemplate[]>(CHECKLIST_TEMPLATES, []);
}

export function saveTemplates(templates: ChecklistTemplate[]): void {
  writeJson(CHECKLIST_TEMPLATES, templates);
}
