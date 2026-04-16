import { useMemo } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { Alert, Box, Stack, Typography } from '@mui/material';
import type { Route } from '@/entities/route/model/types';
import { CheckpointSection } from '@/features/route/components/CheckpointSection';
import { RouteMapper } from '@/features/route/mappers/RouteMapper';
import { EQUIPMENT_BY_ID } from '@/shared/lib/mock/equipment.mock';
import { ROUTES_MOCK } from '@/shared/lib/mock/routes.mock';
import type { Equipment } from '@/entities/equipment/model/types';
import styles from './RouteExecutionPage.module.scss';

function resolveEquipment(equipmentId: string): Equipment {
  return (
    EQUIPMENT_BY_ID[equipmentId] ?? {
      id: equipmentId,
      name: 'Оборудование (нет в справочнике)',
    }
  );
}

export function RouteExecutionPage() {
  const { id } = useParams<{ id: string }>();

  const route: Route | null = useMemo(() => {
    const dto = ROUTES_MOCK.find((r) => r.id === id);
    return dto ? RouteMapper.toViewModel(dto) : null;
  }, [id]);

  if (!id || !route) {
    return <Navigate to="/" replace />;
  }

  return (
    <Stack spacing={2} className={styles.wrap} sx={{ width: '100%' }}>
      <Box sx={{ width: '100%' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {route.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          В продуктиве этот сценарий выполняет <strong>обходчик в мобильном приложении</strong>
          (обход → чек-лист → фото/видео → отправка результатов). Здесь — демо-прохождение
          для проверки маршрута и шаблонов; данные в MVP пишутся в localStorage.
        </Typography>
        <Alert severity="info" sx={{ mb: 1 }}>
          Руководитель производственного звена в типовом процессе получает результаты в
          блоке контроля и анализа на главном экране, а не проходит обход вместо смены.
        </Alert>
      </Box>

      {route.checkpoints.map((cp) => (
        <CheckpointSection
          key={cp.id}
          route={route}
          checkpoint={cp}
          equipment={resolveEquipment(cp.equipmentId)}
        />
      ))}
    </Stack>
  );
}
