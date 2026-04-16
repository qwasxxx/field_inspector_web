import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import type { ShiftEvent } from '@/entities/dashboard/model/types';

type Props = {
  events: ShiftEvent[];
};

export function DashboardShiftEvents({ events }: Props) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 2, height: '100%' }}>
      <CardContent>
        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
          События смены
        </Typography>
        <Stack spacing={0} sx={{ mt: 1 }}>
          {events.map((ev, i) => (
            <Box
              key={ev.id}
              sx={{
                display: 'grid',
                gridTemplateColumns: '52px 1fr',
                gap: 1,
                py: 1.25,
                borderBottom:
                  i < events.length - 1 ? '1px solid' : 'none',
                borderColor: 'divider',
              }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ pt: 0.25 }}>
                {ev.time}
              </Typography>
              <Box>
                <Typography variant="body2" fontWeight={600}>
                  {ev.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {ev.detail}
                </Typography>
              </Box>
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}
