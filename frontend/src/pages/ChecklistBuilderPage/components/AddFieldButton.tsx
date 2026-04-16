import AddIcon from '@mui/icons-material/Add';
import { Button } from '@mui/material';

type Props = {
  onClick: () => void;
  disabled?: boolean;
};

export function AddFieldButton({ onClick, disabled }: Props) {
  return (
    <Button
      type="button"
      variant="outlined"
      startIcon={<AddIcon />}
      onClick={onClick}
      disabled={disabled}
    >
      Добавить поле
    </Button>
  );
}
