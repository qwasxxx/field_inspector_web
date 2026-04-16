import type { ChecklistItem } from '@/entities/checklist/model/types';
import type { ChecklistField, ChecklistTemplate } from '@/entities/checklist/checklist.types';

function newId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export class ChecklistBuilderMapper {
  static createEmptyField(): ChecklistField {
    return {
      id: newId(),
      label: '',
      type: 'text',
      required: true,
    };
  }

  static createEmptyTemplate(): ChecklistTemplate {
    return {
      id: newId(),
      title: '',
      items: [ChecklistBuilderMapper.createEmptyField()],
    };
  }

  /** Шаблон конструктора → пункты для экрана обхода */
  static templateToChecklistItems(template: ChecklistTemplate): ChecklistItem[] {
    return template.items.map((f) => ({
      id: f.id,
      label: f.label,
      type: f.type === 'checkbox' ? 'boolean' : f.type,
      required: f.required !== false,
    }));
  }
}
