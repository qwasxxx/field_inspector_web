import { useCallback } from 'react';
import type { ChecklistTemplate } from '@/entities/checklist/checklist.types';
import {
  getChecklistTemplates,
  setChecklistTemplates,
} from '@/features/checklist/builder/checklistTemplatesStore';
import { ChecklistBuilderMapper } from '@/features/checklist/builder/checklistBuilder.mapper';
import { API_BASE, apiFetch } from '@/shared/api/client';

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

  const saveChecklist = useCallback(async (template: ChecklistTemplate) => {
    if (API_BASE) {
      const list = getChecklistTemplates();
      const exists = list.some((t) => t.id === template.id);
      const path = exists
        ? `/api/v1/checklist-templates/${encodeURIComponent(template.id)}`
        : '/api/v1/checklist-templates';
      const method = exists ? 'PUT' : 'POST';
      const body = exists
        ? JSON.stringify({ title: template.title, items: template.items })
        : JSON.stringify({
            id: template.id,
            title: template.title,
            items: template.items,
          });
      const res = await apiFetch(path, { method, body });
      if (!res.ok) {
        throw new Error(await res.text());
      }
    }
    const list = getChecklistTemplates();
    const idx = list.findIndex((t) => t.id === template.id);
    const next =
      idx === -1
        ? [...list, template]
        : list.map((t, i) => (i === idx ? template : t));
    setChecklistTemplates(next);
  }, []);

  const deleteTemplate = useCallback(async (id: string) => {
    if (API_BASE) {
      const res = await apiFetch(
        `/api/v1/checklist-templates/${encodeURIComponent(id)}`,
        { method: 'DELETE' },
      );
      if (!res.ok) {
        throw new Error(await res.text());
      }
    }
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
