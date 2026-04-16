import { useCallback } from 'react';
import type { ChecklistTemplate } from '@/entities/checklist/checklist.types';
import {
  getChecklistTemplates,
  setChecklistTemplates,
} from '@/features/checklist/builder/checklistTemplatesStore';
import { ChecklistBuilderMapper } from '@/features/checklist/builder/checklistBuilder.mapper';

export function useChecklistBuilder() {
  const addField = useCallback((draft: ChecklistTemplate): ChecklistTemplate => ({
    ...draft,
    items: [...draft.items, ChecklistBuilderMapper.createEmptyField()],
  }), []);

  const removeField = useCallback(
    (draft: ChecklistTemplate, fieldId: string): ChecklistTemplate => ({
      ...draft,
      items: draft.items.filter((f) => f.id !== fieldId),
    }),
    [],
  );

  const updateField = useCallback(
    (
      draft: ChecklistTemplate,
      fieldId: string,
      patch: Partial<ChecklistTemplate['items'][number]>,
    ): ChecklistTemplate => ({
      ...draft,
      items: draft.items.map((f) =>
        f.id === fieldId ? { ...f, ...patch } : f,
      ),
    }),
    [],
  );

  const saveChecklist = useCallback((template: ChecklistTemplate) => {
    const list = getChecklistTemplates();
    const idx = list.findIndex((t) => t.id === template.id);
    const next =
      idx === -1
        ? [...list, template]
        : list.map((t, i) => (i === idx ? template : t));
    setChecklistTemplates(next);
  }, []);

  const deleteTemplate = useCallback((id: string) => {
    setChecklistTemplates(getChecklistTemplates().filter((t) => t.id !== id));
  }, []);

  return {
    addField,
    removeField,
    updateField,
    saveChecklist,
    deleteTemplate,
    createEmptyTemplate: ChecklistBuilderMapper.createEmptyTemplate,
  };
}
