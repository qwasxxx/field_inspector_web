import { alpha, Box, Button, Typography } from '@mui/material';
import type { CriticalDefectAlert } from '@/entities/dashboard/model/types';

type Props = {
  alert: CriticalDefectAlert;
  onView?: () => void;
};

export function DashboardCriticalAlert({ alert, onView }: Props) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: { xs: 'flex-start', sm: 'center' },
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 2,
        px: 2,
        py: 1.5,
        borderRadius: 2,
        bgcolor: (t) => alpha(t.palette.error.main, 0.12),
        border: 1,
        borderColor: (t) => alpha(t.palette.error.main, 0.35),
      }}
    >
      <Typography variant="body2" sx={{ flex: 1, color: 'text.primary' }}>
        {alert.message} Зафиксировано {alert.time}
      </Typography>
      <Button
        size="small"
        onClick={onView}
        sx={{ alignSelf: { xs: 'flex-end', sm: 'center' }, color: 'error.main' }}
      >
        Посмотреть
      </Button>
    </Box>
  );
}
