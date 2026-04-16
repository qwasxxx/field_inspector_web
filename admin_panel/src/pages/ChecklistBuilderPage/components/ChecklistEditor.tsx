import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';
import { useEffect } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { ChecklistBuilderHandlers } from '@/features/checklist/builder/checklistBuilder.handlers';
import { ChecklistBuilderMapper } from '@/features/checklist/builder/checklistBuilder.mapper';
import {
  checklistTemplateFormSchema,
  type ChecklistTemplateFormValues,
} from '@/features/checklist/builder/checklistBuilder.validation';
import type { ChecklistTemplate } from '@/entities/checklist/checklist.types';
import { useChecklistBuilder } from '@/features/checklist/builder/useChecklistBuilder';
import { AddFieldButton } from '@/pages/ChecklistBuilderPage/components/AddFieldButton';
import { ChecklistFieldItem } from '@/pages/ChecklistBuilderPage/components/ChecklistFieldItem';

type Props = {
  template: ChecklistTemplate;
  isNew: boolean;
  onDone: () => void;
};

function toFormValues(t: ChecklistTemplate): ChecklistTemplateFormValues {
  return {
    title: t.title,
    items: t.items.map((i) => ({
      id: i.id,
      label: i.label,
      type: i.type,
      required: i.required !== false,
    })),
  };
}

export function ChecklistEditor({ template, isNew, onDone }: Props) {
  const { saveChecklist } = useChecklistBuilder();

  const form = useForm<ChecklistTemplateFormValues>({
    resolver: zodResolver(checklistTemplateFormSchema),
    mode: 'onChange',
    defaultValues: toFormValues(template),
  });

  const { control, handleSubmit, reset, formState } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  useEffect(() => {
    reset(toFormValues(template));
  }, [template, reset]);

  const onSubmit = (values: ChecklistTemplateFormValues) => {
    const saved: ChecklistTemplate = {
      id: template.id,
      title: values.title.trim(),
      items: values.items.map((i) => ({
        id: i.id,
        label: i.label.trim(),
        type: i.type,
        required: i.required,
      })),
    };
    saveChecklist(saved);
    onDone();
  };

  const handleAddField = () => {
    ChecklistBuilderHandlers.handleAddField(() => {
      append({
        ...ChecklistBuilderMapper.createEmptyField(),
        required: true,
      });
    });
  };

  return (
    <Card variant="outlined" sx={{ borderRadius: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {isNew ? 'Новый чек-лист' : 'Редактирование чек-листа'}
        </Typography>
        <Box
          component="form"
          noValidate
          onSubmit={handleSubmit(onSubmit)}
        >
          <Stack spacing={2}>
            <Controller
              name="title"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label="Название чек-листа"
                  fullWidth
                  required
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message}
                />
              )}
            />

            <Typography variant="subtitle2" color="text.secondary">
              Поля
            </Typography>

            <Stack spacing={2}>
              {fields.map((row, index) => (
                <ChecklistFieldItem
                  key={row.id}
                  control={control}
                  row={row}
                  index={index}
                  remove={remove}
                  canRemove={fields.length > 1}
                />
              ))}
            </Stack>

            <AddFieldButton
              onClick={handleAddField}
              disabled={fields.length >= 50}
            />

            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button type="button" variant="text" onClick={onDone}>
                Отмена
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={!formState.isValid}
              >
                Сохранить
              </Button>
            </Stack>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
}
