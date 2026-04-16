import { Checkbox, FormControlLabel, TextField } from '@mui/material';
import type { ChecklistItem } from '@/entities/checklist/model/types';
import {
  routeExecutionActions,
  useRouteExecutionStore,
  type RouteExecutionState,
} from '@/features/route/model/routeExecutionStore';

type Props = {
  item: ChecklistItem;
  storageKey: string;
};

export function ChecklistItemField({ item, storageKey }: Props) {
  const value = useRouteExecutionStore(
    (s: RouteExecutionState) => s.checklistValues[storageKey],
  );

  const req = item.required !== false;
  const labelText = req ? `${item.label} *` : item.label;

  if (item.type === 'boolean') {
    const checked = value === true;
    return (
      <FormControlLabel
        control={
          <Checkbox
            checked={checked}
            onChange={(_, v) =>
              routeExecutionActions.setChecklistValue(storageKey, v)
            }
          />
        }
        label={labelText}
      />
    );
  }

  if (item.type === 'number') {
    const str =
      value === undefined || value === null
        ? ''
        : typeof value === 'number'
          ? String(value)
          : String(value);

    return (
      <TextField
        label={labelText}
        type="number"
        fullWidth
        required={req}
        value={str}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === '') {
            routeExecutionActions.setChecklistValue(storageKey, '');
            return;
          }
          const n = Number(raw.replace(',', '.'));
          if (!Number.isNaN(n))
            routeExecutionActions.setChecklistValue(storageKey, n);
        }}
        inputProps={{ step: 'any' }}
      />
    );
  }

  return (
    <TextField
      label={labelText}
      fullWidth
      required={req}
      multiline
      minRows={2}
      value={typeof value === 'string' ? value : ''}
      onChange={(e) =>
        routeExecutionActions.setChecklistValue(storageKey, e.target.value)
      }
    />
  );
}
