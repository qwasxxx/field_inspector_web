import AudiotrackRoundedIcon from '@mui/icons-material/AudiotrackRounded';
import ImageRoundedIcon from '@mui/icons-material/ImageRounded';
import {
  Alert,
  Box,
  CircularProgress,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import {
  attachSignedUrls,
  fetchInspectionMediaForReport,
  type MediaWithUrl,
} from '@/features/factory/services/reportMediaApi';
import { ReportDetailSection } from '@/pages/ReportsPage/reportDisplay';

type Props = {
  taskId: string;
  equipmentId: string;
  /** Время создания строки отчёта — чтобы не показывать вложения от предыдущих отправок по тому же пункту. */
  reportCreatedAt: string | null | undefined;
  photoCount: number;
  audioCount: number;
};

export function ReportAttachments({
  taskId,
  equipmentId,
  reportCreatedAt,
  photoCount,
  audioCount,
}: Props) {
  const [items, setItems] = useState<MediaWithUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void (async () => {
      const rows = await fetchInspectionMediaForReport(
        taskId,
        equipmentId,
        reportCreatedAt,
      );
      if (cancelled) return;
      if (rows.length === 0 && (photoCount > 0 || audioCount > 0)) {
        setError(
          'Метаданные вложений не найдены. Проверьте таблицу вложений и права доступа.',
        );
        setItems([]);
        setLoading(false);
        return;
      }
      const withUrls = await attachSignedUrls(rows);
      if (cancelled) return;
      setItems(withUrls);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [taskId, equipmentId, reportCreatedAt, photoCount, audioCount]);

  const photos = items.filter((x) => x.media_type === 'photo');
  const audios = items.filter((x) => x.media_type === 'audio');

  return (
    <ReportDetailSection title="Вложения">
      {loading ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
          <CircularProgress size={22} />
          <Typography variant="body2" color="text.secondary">
            Загрузка…
          </Typography>
        </Box>
      ) : null}
      {error ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      {!loading && photos.length === 0 && audios.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {photoCount === 0 && audioCount === 0
            ? 'Файлы не прикреплялись.'
            : 'Не удалось загрузить список файлов.'}
        </Typography>
      ) : null}

      {photos.length > 0 ? (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <ImageRoundedIcon fontSize="small" /> Фотографии
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: 1.5,
            }}
          >
            {photos.map((p, i) => (
              <Box key={p.id ?? `${p.file_path}-${i}`}>
                {p.signedUrl ? (
                  <Box
                    component="a"
                    href={p.signedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ display: 'block' }}
                  >
                    <Box
                      component="img"
                      src={p.signedUrl}
                      alt={p.file_name ?? 'фото'}
                      sx={{
                        width: '100%',
                        height: 140,
                        objectFit: 'cover',
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    />
                  </Box>
                ) : (
                  <Typography variant="caption" color="error">
                    {p.urlError ?? 'Нет доступа к файлу'}
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary" display="block" noWrap title={p.file_name ?? ''}>
                  {p.file_name ?? 'фото'}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      ) : null}

      {audios.length > 0 ? (
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <AudiotrackRoundedIcon fontSize="small" /> Аудио
          </Typography>
          <StackAudios items={audios} />
        </Box>
      ) : null}
    </ReportDetailSection>
  );
}

function StackAudios({ items }: { items: MediaWithUrl[] }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {items.map((a, i) => (
        <Box key={a.id ?? `${a.file_path}-${i}`}>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
            {a.file_name ?? 'Запись'}
          </Typography>
          {a.signedUrl ? (
            <Box
              component="audio"
              controls
              src={a.signedUrl}
              sx={{ width: '100%', maxWidth: 480 }}
            />
          ) : (
            <Typography variant="caption" color="error">
              {a.urlError ?? 'Нет доступа к файлу'}
            </Typography>
          )}
        </Box>
      ))}
    </Box>
  );
}
