import { Box, Card, CardContent, LinearProgress, Stack, Typography } from '@mui/material';
import type { ShiftProgressItem } from '@/entities/dashboard/model/types';

type Props = {
  items: ShiftProgressItem[];
};

function isOnTrack(current: number, total: number): boolean {
  if (total <= 0) return true;
  return current / total >= 0.7;
}

export function DashboardObjectProgress({ items }: Props) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 2, width: '100%' }}>
      <CardContent>
        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
          Прогресс по объектам
        </Typography>
        <Stack spacing={2} sx={{ mt: 2 }}>
          {items.map((row) => {
            const pct = row.total > 0 ? Math.round((100 * row.current) / row.total) : 0;
            const ok = isOnTrack(row.current, row.total);
            return (
              <Box key={row.id}>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 0.5 }}>
                  <Typography variant="body2" sx={{ minWidth: 120, flexShrink: 0 }}>
                    {row.name}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={pct}
                    sx={{
                      flex: 1,
                      height: 8,
                      borderRadius: 1,
                      bgcolor: 'action.hover',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 1,
                        bgcolor: ok ? 'success.main' : 'warning.main',
                      },
                    }}
                  />
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ minWidth: 48, textAlign: 'right' }}
                  >
                    {row.current}/{row.total}
                  </Typography>
                </Stack>
              </Box>
            );
          })}
        </Stack>
      </CardContent>
    </Card>
  );
}
