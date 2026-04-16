import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
} from '@mui/material';
import type { DashboardEmployee, EmployeeShiftStatus } from '@/entities/dashboard/model/types';

type Props = {
  employees: DashboardEmployee[];
};

function statusChipColor(
  status: EmployeeShiftStatus,
): 'success' | 'error' | 'warning' | 'default' {
  switch (status) {
    case 'in_work':
      return 'success';
    case 'defect':
      return 'error';
    case 'offline':
      return 'warning';
    case 'break':
    default:
      return 'default';
  }
}

export function DashboardEmployeesColumn({ employees }: Props) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 2, height: '100%' }}>
      <CardContent>
        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
          Сотрудники в смене
        </Typography>
        <Stack spacing={1.5} sx={{ mt: 1 }}>
          {employees.map((e) => (
            <Stack
              key={e.id}
              direction="row"
              alignItems="center"
              spacing={1.5}
              sx={{ flexWrap: 'wrap' }}
            >
              <Avatar sx={{ width: 40, height: 40, fontSize: '0.875rem' }}>
                {e.initials}
              </Avatar>
              <Box flex={1} minWidth={0}>
                <Typography variant="body2" fontWeight={600} noWrap>
                  {e.name}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap>
                  {e.locationHint}
                </Typography>
              </Box>
              <Chip
                size="small"
                label={e.statusLabel}
                color={statusChipColor(e.status)}
                variant={e.status === 'break' ? 'outlined' : 'filled'}
              />
            </Stack>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}
