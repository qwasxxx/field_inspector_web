import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import {
  Box,
  Checkbox,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  type SelectChangeEvent,
  Stack,
  TextField,
} from '@mui/material';
import type { Control, FieldArrayWithId, UseFieldArrayRemove } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import type { ChecklistTemplateFormValues } from '@/features/checklist/builder/checklistBuilder.validation';

type Props = {
  control: Control<ChecklistTemplateFormValues>;
  row: FieldArrayWithId<ChecklistTemplateFormValues, 'items', 'id'>;
  index: number;
  remove: UseFieldArrayRemove;
  canRemove: boolean;
};

const TYPE_LABELS: Record<string, string> = {
  text: 'Текст',
  number: 'Число',
  checkbox: 'Да / нет',
};

export function ChecklistFieldItem({
  control,
  row,
  index,
  remove,
  canRemove,
}: Props) {
  return (
    <Box
      sx={{
        p: 2,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        bgcolor: 'background.paper',
      }}
    >
      <Stack direction="row" alignItems="flex-start" spacing={1}>
        <Stack spacing={2} flex={1} minWidth={0}>
          <Controller
            name={`items.${index}.label`}
            control={control}
            render={({ field: f, fieldState }) => (
              <TextField
                {...f}
                label="Подпись поля"
                fullWidth
                required
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
              />
            )}
          />
          <Controller
            name={`items.${index}.type`}
            control={control}
            render={({ field: f }) => (
              <FormControl fullWidth>
                <InputLabel id={`type-${row.id}`}>Тип поля</InputLabel>
                <Select
                  {...f}
                  labelId={`type-${row.id}`}
                  label="Тип поля"
                  value={f.value}
                  onChange={(e: SelectChangeEvent<string>) =>
                    f.onChange(e.target.value)
                  }
                >
                  {Object.entries(TYPE_LABELS).map(([value, label]) => (
                    <MenuItem key={value} value={value}>
                      {label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          />
          <Controller
            name={`items.${index}.required`}
            control={control}
            render={({ field: f }) => (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={Boolean(f.value)}
                    onChange={(_, v) => f.onChange(v)}
                  />
                }
                label="Обязательное поле"
              />
            )}
          />
        </Stack>
        <IconButton
          type="button"
          aria-label="Удалить поле"
          color="error"
          disabled={!canRemove}
          onClick={() => remove(index)}
          sx={{ mt: 0.5 }}
        >
          <DeleteOutlineIcon />
        </IconButton>
      </Stack>
    </Box>
  );
}
