import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import type { DashboardMetric } from '@/entities/dashboard/model/types';

type Props = {
  metrics: DashboardMetric[];
};

export function DashboardMetricCards({ metrics }: Props) {
  return (
    <Stack direction="row" flexWrap="wrap" useFlexGap gap={2}>
      {metrics.map((m) => (
        <Box key={m.id} sx={{ flex: '1 1 200px', minWidth: { xs: '100%', sm: 'calc(50% - 8px)', md: 'calc(25% - 12px)' } }}>
          <Card variant="outlined" sx={{ height: '100%', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {m.title}
              </Typography>
              <Typography variant="h5" component="p" fontWeight={700}>
                {m.value}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {m.caption}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      ))}
    </Stack>
  );
}
