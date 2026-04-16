export type ChecklistItemType = 'boolean' | 'number' | 'text';

export type ChecklistItem = {
  id: string;
  label: string;
  type: ChecklistItemType;
  /** По умолчанию поле обязательное; для шаблонов из конструктора */
  required?: boolean;
  value?: unknown;
};
