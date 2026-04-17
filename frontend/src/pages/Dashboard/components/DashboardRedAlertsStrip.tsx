import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import { alpha, Box, Button, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

type Props = {
  count: number;
  loading?: boolean;
  error?: string | null;
  /** null — ещё не известно; false — realtime не подписан / ошибка канала */
  realtimeOk?: boolean | null;
};

export function DashboardRedAlertsStrip({ count, loading, error, realtimeOk }: Props) {
  if (error) {
    return (
      <Box
        sx={{
          px: 2,
          py: 1.25,
          borderRadius: 2,
          border: 1,
          borderColor: 'divider',
          bgcolor: 'action.hover',
        }}
      >
        <Typography variant="body2" color="error">
          Красные тревоги: не удалось загрузить счётчик — {error}
        </Typography>
      </Box>
    );
  }

  const liveHint =
    realtimeOk === false && !error ? (
      <Typography component="span" variant="caption" color="warning.main" sx={{ ml: 1 }}>
        (обновления live недоступны)
      </Typography>
    ) : null;

  const hasOpen = count > 0;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 2,
        px: 2,
        py: 1.25,
        borderRadius: 2,
        bgcolor: (t) =>
          hasOpen ? alpha(t.palette.error.main, 0.1) : alpha(t.palette.success.main, 0.06),
        border: 1,
        borderColor: (t) =>
          hasOpen ? alpha(t.palette.error.main, 0.45) : alpha(t.palette.success.main, 0.25),
      }}
    >
      <WarningAmberRoundedIcon color={hasOpen ? 'error' : 'success'} sx={{ fontSize: 26 }} />
      <Typography variant="body2" sx={{ flex: 1, minWidth: 200, fontWeight: hasOpen ? 700 : 500 }}>
        {hasOpen ? (
          <>
            Открытых критических тревог:{' '}
            <Box component="span" color="error.main">
              {loading ? '…' : count}
            </Box>
          </>
        ) : (
          <>Открытых критических тревог нет{loading ? '…' : ''}</>
        )}
        {liveHint}
      </Typography>
      <Button component={RouterLink} to="/red-alerts" size="small" variant={hasOpen ? 'contained' : 'outlined'} color="error">
        Красные тревоги
      </Button>
    </Box>
  );
}
