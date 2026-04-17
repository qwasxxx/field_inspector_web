import {
  Alert,
  Box,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { useInspectionReportDetail } from '@/features/factory/hooks/useInspectionReportDetail';
import { ReportAttachments } from '@/pages/ReportsPage/ReportAttachments';
import {
  defectPriorityRu,
  ReportChecklistView,
  ReportDetailSection,
  ReportMeasurementsView,
} from '@/pages/ReportsPage/reportDisplay';
import { formatDateTime } from '@/shared/lib/formatDate';
import { isSupabaseConfigured } from '@/shared/lib/supabase/client';

export function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { bundle, loading, error } = useInspectionReportDetail(id);
  const configured = isSupabaseConfigured();
  const r = bundle?.report;
  const t = bundle?.task;

  return (
    <Box sx={{ width: '100%', maxWidth: 880 }}>
      <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
        Отчёт осмотра
      </Typography>
      <Typography variant="body2" sx={{ mb: 2 }}>
        <RouterLink to="/reports">← Назад к списку</RouterLink>
      </Typography>

      {!configured ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Просмотр недоступен: не настроено подключение к данным.
        </Alert>
      ) : null}
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      {loading ? (
        <CircularProgress size={28} />
      ) : !r ? (
        <Typography color="text.secondary">Нет данных.</Typography>
      ) : (
        <Stack spacing={2.5}>
          <Paper variant="outlined" sx={{ p: 2.5 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Когда отправлен
            </Typography>
            <Typography variant="body1" gutterBottom>
              {formatDateTime(r.created_at as string | undefined)}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1.5 }}>
              Задание
            </Typography>
            <Typography variant="body1" gutterBottom>
              {t?.title ?? '—'}
              {t?.id ? (
                <>
                  {' '}
                  <RouterLink to={`/tasks/${t.id}`}>Перейти к заданию</RouterLink>
                </>
              ) : null}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1.5 }}>
              Площадка и участок
            </Typography>
            <Typography variant="body1" gutterBottom>
              {t?.site_name ?? '—'} · {t?.area_name ?? '—'}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1.5 }}>
              Оборудование
            </Typography>
            <Typography variant="body1">{bundle?.equipment_name ?? '—'}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Код: {bundle?.equipment_code ?? '—'}
              {bundle?.equipment_location ? ` · Место: ${bundle.equipment_location}` : null}
            </Typography>
          </Paper>

          <ReportDetailSection title="Проверки по чек-листу">
            <ReportChecklistView checklist={r.checklist} />
          </ReportDetailSection>

          <ReportDetailSection title="Показания и замеры">
            <ReportMeasurementsView measurements={r.measurements} />
          </ReportDetailSection>

          <ReportDetailSection title="Комментарий инспектора">
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {(r.comment_text as string | undefined)?.trim() || '—'}
            </Typography>
          </ReportDetailSection>

          <ReportDetailSection title="Замеченный дефект">
            <Typography variant="body1">
              {r.defect_found ? (
                <>
                  Да
                  {r.defect_priority ? (
                    <> · важность: {defectPriorityRu(String(r.defect_priority))}</>
                  ) : null}
                </>
              ) : (
                'Нет'
              )}
            </Typography>
            {r.defect_found && r.defect_description ? (
              <Typography variant="body2" sx={{ mt: 1.5, whiteSpace: 'pre-wrap' }}>
                {String(r.defect_description)}
              </Typography>
            ) : null}
          </ReportDetailSection>

          {r.task_id && r.equipment_id ? (
            <ReportAttachments
              taskId={r.task_id}
              equipmentId={r.equipment_id}
              reportCreatedAt={r.created_at as string | undefined}
              photoCount={r.photo_count ?? 0}
              audioCount={r.audio_count ?? 0}
            />
          ) : null}
        </Stack>
      )}
    </Box>
  );
}
