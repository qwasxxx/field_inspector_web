/** Поля шаблона в конструкторе (checkbox → boolean при исполнении обхода) */
export type ChecklistField = {
  id: string;
  label: string;
  type: 'text' | 'number' | 'checkbox';
  required?: boolean;
};

export type ChecklistTemplate = {
  id: string;
  title: string;
  items: ChecklistField[];
};
