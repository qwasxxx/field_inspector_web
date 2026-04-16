import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { Alert, Box, CircularProgress, Stack, Typography } from '@mui/material';
import type { Route } from '@/entities/route/model/types';
import type { Equipment } from '@/entities/equipment/model/types';
import { CheckpointSection } from '@/features/route/components/CheckpointSection';
import { RouteMapper } from '@/features/route/mappers/RouteMapper';
import { EQUIPMENT_BY_ID } from '@/shared/lib/mock/equipment.mock';
import { ROUTES_MOCK } from '@/shared/lib/mock/routes.mock';
import { API_BASE, apiFetch } from '@/shared/api/client';
import styles from './RouteExecutionPage.module.scss';

function resolveEquipment(
  equipmentMap: Record<string, Equipment>,
  equipmentId: string,
): Equipment {
  return (
    equipmentMap[equipmentId] ?? {
      id: equipmentId,
      name: 'Оборудование (нет в справочнике)',
    }
  );
}

export function RouteExecutionPage() {
  const { id } = useParams<{ id: string }>();
  const [route, setRoute] = useState<Route | null | undefined>(undefined);
  const [equipmentMap, setEquipmentMap] =
    useState<Record<string, Equipment>>(EQUIPMENT_BY_ID);

  useEffect(() => {
    if (!id) return;

    if (!API_BASE) {
      const dto = ROUTES_MOCK.find((r) => r.id === id);
      setRoute(dto ? RouteMapper.toViewModel(dto) : null);
      setEquipmentMap(EQUIPMENT_BY_ID);
      return;
    }

    let cancelled = false;
    setRoute(undefined);

    void (async () => {
      const res = await apiFetch(`/api/v1/routes/${encodeURIComponent(id)}`);
      if (cancelled) return;
      if (!res.ok) {
        setRoute(null);
        return;
      }
      const dto = await res.json();
      setRoute(RouteMapper.toViewModel(dto));

      const eqRes = await apiFetch('/api/v1/equipment');
      if (cancelled || !eqRes.ok) return;
      const list: Equipment[] = await eqRes.json();
      setEquipmentMap(Object.fromEntries(list.map((e) => [e.id, e])));
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!id) {
    return <Navigate to="/" replace />;
  }

  if (route === undefined && API_BASE) {
    return (
      <Box className={styles.wrap} sx={{ py: 6, textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!route) {
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
          equipment={resolveEquipment(equipmentMap, cp.equipmentId)}
        />
      ))}
    </Stack>
  );
}
