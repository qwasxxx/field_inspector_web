import { z } from 'zod';

const fieldSchema = z.object({
  id: z.string(),
  label: z.string().min(1, 'Укажите подпись поля'),
  type: z.enum(['text', 'number', 'checkbox']),
  required: z.boolean().optional(),
});

export const checklistTemplateFormSchema = z.object({
  title: z.string().min(1, 'Введите название чек-листа'),
  items: z.array(fieldSchema).min(1, 'Добавьте хотя бы одно поле'),
});

export type ChecklistTemplateFormValues = z.infer<typeof checklistTemplateFormSchema>;
