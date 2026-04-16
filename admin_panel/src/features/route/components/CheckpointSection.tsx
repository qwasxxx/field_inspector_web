import { useEffect, useMemo, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  type SelectChangeEvent,
  Stack,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import type { Checkpoint, Route } from '@/entities/route/model/types';
import type { Equipment } from '@/entities/equipment/model/types';
import { ChecklistItemField } from '@/features/checklist/components/ChecklistItemField';
import { ChecklistBuilderMapper } from '@/features/checklist/builder/checklistBuilder.mapper';
import { useChecklistTemplatesList } from '@/features/checklist/builder/checklistTemplatesStore';
import { EquipmentCard } from '@/features/equipment/components/EquipmentCard';
import { RouteHandlers } from '@/features/route/handlers/RouteHandlers';
import { valueKey } from '@/features/route/lib/routeProgress';
import {
  routeExecutionActions,
  useRouteExecutionStore,
  type RouteExecutionState,
} from '@/features/route/model/routeExecutionStore';

type Props = {
  route: Route;
  checkpoint: Checkpoint;
  equipment: Equipment;
};

function checkpointKey(routeId: string, checkpointId: string): string {
  return `${routeId}:${checkpointId}`;
}

export function CheckpointSection({ route, checkpoint, equipment }: Props) {
  const [error, setError] = useState<string | null>(null);
  const ck = checkpointKey(route.id, checkpoint.id);
  const templates = useChecklistTemplatesList();

  const storedTemplateId =
    useRouteExecutionStore(
      (s: RouteExecutionState) => s.checkpointTemplateId[ck] ?? null,
    ) ?? null;

  const selectedTemplateId =
    storedTemplateId &&
    templates.some((t) => t.id === storedTemplateId)
      ? storedTemplateId
      : null;

  useEffect(() => {
    if (
      storedTemplateId &&
      !templates.some((t) => t.id === storedTemplateId)
    ) {
      routeExecutionActions.setCheckpointTemplate(
        route.id,
        checkpoint.id,
        null,
      );
    }
  }, [storedTemplateId, templates, route.id, checkpoint.id]);

  const completedIds =
    useRouteExecutionStore(
      (s: RouteExecutionState) => s.completedCheckpointIds[route.id],
    ) ?? [];
  const isDone = completedIds.includes(checkpoint.id);
  const photoKey = `${route.id}:${checkpoint.id}`;
  const photos =
    useRouteExecutionStore(
      (s: RouteExecutionState) => s.photoIdsByCheckpoint[photoKey],
    ) ?? [];

  const effectiveChecklist = useMemo(() => {
    if (!selectedTemplateId) {
      return checkpoint.checklist;
    }
    const tpl = templates.find((t) => t.id === selectedTemplateId);
    if (!tpl) {
      return checkpoint.checklist;
    }
    return ChecklistBuilderMapper.templateToChecklistItems(tpl);
  }, [checkpoint.checklist, selectedTemplateId, templates]);

  const effectiveCheckpoint: Checkpoint = useMemo(
    () => ({
      ...checkpoint,
      checklist: effectiveChecklist,
    }),
    [checkpoint, effectiveChecklist],
  );

  const handleTemplateChange = (e: SelectChangeEvent<string>) => {
    const v = e.target.value;
    routeExecutionActions.setCheckpointTemplate(
      route.id,
      checkpoint.id,
      v === '' ? null : v,
    );
    setError(null);
  };

  const handleComplete = () => {
    setError(null);
    const result = RouteHandlers.handleCheckpointComplete(route, effectiveCheckpoint);
    if (!result.ok) {
      setError(result.reason ?? 'Ошибка');
      return;
    }
  };

  const handlePhoto = () => {
    RouteHandlers.handlePhotoMock(route.id, checkpoint.id);
  };

  return (
    <Accordion
      defaultExpanded={!isDone}
      disableGutters
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '12px !important',
        '&:before': { display: 'none' },
        mb: 2,
        overflow: 'hidden',
      }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
          <Typography fontWeight={600}>{checkpoint.id}</Typography>
          {isDone ? (
            <Chip
              size="small"
              color="success"
              icon={<TaskAltOutlinedIcon />}
              label="Точка пройдена"
            />
          ) : (
            <Chip size="small" variant="outlined" label="В работе" />
          )}
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        <EquipmentCard equipment={equipment} />

        <FormControl fullWidth sx={{ mb: 2 }} size="small" disabled={isDone}>
          <InputLabel id={`tpl-label-${ck}`}>Шаблон чек-листа</InputLabel>
          <Select
            labelId={`tpl-label-${ck}`}
            label="Шаблон чек-листа"
            value={selectedTemplateId ?? ''}
            onChange={handleTemplateChange}
          >
            <MenuItem value="">
              Встроенный (из маршрута)
            </MenuItem>
            {templates.map((t) => (
              <MenuItem key={t.id} value={t.id}>
                {t.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Чек-лист
        </Typography>
        <Stack spacing={2} sx={{ mb: 2 }}>
          {effectiveChecklist.map((item) => (
            <ChecklistItemField
              key={item.id}
              item={item}
              storageKey={valueKey(route.id, checkpoint.id, item.id)}
            />
          ))}
        </Stack>

        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Фото (демо)
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
          {photos.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Нет снимков — добавьте для имитации офлайн-очереди.
            </Typography>
          ) : (
            photos.map((id: string) => (
              <Chip key={id} size="small" label={id} variant="outlined" />
            ))
          )}
        </Stack>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<PhotoCameraOutlinedIcon />}
            onClick={handlePhoto}
            disabled={isDone}
          >
            Добавить фото
          </Button>
          <Button
            variant="contained"
            onClick={handleComplete}
            disabled={isDone}
          >
            Завершить точку
          </Button>
        </Box>

        {error ? (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        ) : null}
      </AccordionDetails>
    </Accordion>
  );
}
