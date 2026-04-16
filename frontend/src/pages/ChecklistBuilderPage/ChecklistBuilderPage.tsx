import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Stack,
  Typography,
} from '@mui/material';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import { useChecklistBuilder } from '@/features/checklist/builder/useChecklistBuilder';
import {
  setChecklistTemplates,
  useChecklistTemplatesList,
} from '@/features/checklist/builder/checklistTemplatesStore';
import type { ChecklistTemplate } from '@/entities/checklist/checklist.types';
import { ChecklistEditor } from '@/pages/ChecklistBuilderPage/components/ChecklistEditor';
import { API_BASE, apiFetch } from '@/shared/api/client';
import styles from './ChecklistBuilderPage.module.scss';

export function ChecklistBuilderPage() {
  const templates = useChecklistTemplatesList();
  const { deleteTemplate, createEmptyTemplate } = useChecklistBuilder();
  const [draft, setDraft] = useState<ChecklistTemplate | null>(null);

  useEffect(() => {
    if (!API_BASE) return;
    let cancelled = false;
    void (async () => {
      const res = await apiFetch('/api/v1/checklist-templates');
      if (!res.ok || cancelled) return;
      const data: ChecklistTemplate[] = await res.json();
      if (cancelled) return;
      setChecklistTemplates(data);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (draft) {
    const isNew = !templates.some((t) => t.id === draft.id);
    return (
      <Stack spacing={2} className={styles.wrap}>
        <Button variant="text" onClick={() => setDraft(null)}>
          ← К списку шаблонов
        </Button>
        <ChecklistEditor
          template={draft}
          isNew={isNew}
          onDone={() => setDraft(null)}
        />
      </Stack>
    );
  }

  return (
    <Stack spacing={3} className={styles.wrap}>
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Конструктор чек-листов
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Подготовка нормативных списков проверок для обходчиков в цеху. В целевой системе
          шаблоны синхронизируются через сервисы мобильного офиса; в MVP — только{' '}
          <strong>localStorage</strong> (ключ CHECKLIST_TEMPLATES).
        </Typography>
      </Box>

      <Box>
        <Button
          variant="contained"
          startIcon={<FactCheckOutlinedIcon />}
          onClick={() => setDraft(createEmptyTemplate())}
        >
          Создать чек-лист
        </Button>
      </Box>

      {templates.length === 0 ? (
        <Typography color="text.secondary">
          Пока нет сохранённых шаблонов — создайте первый.
        </Typography>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
            },
            gap: 2,
            width: '100%',
          }}
        >
          {templates.map((t) => (
            <Card key={t.id} elevation={0} className={styles.card}>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="flex-start">
                  <FactCheckOutlinedIcon color="primary" sx={{ mt: 0.25 }} />
                  <Box flex={1} minWidth={0}>
                    <Typography variant="h6" component="h2" noWrap title={t.title}>
                      {t.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Полей: {t.items.length}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
              <CardActions sx={{ px: 2, pb: 2, pt: 0, gap: 1 }}>
                <Button size="small" onClick={() => setDraft(t)}>
                  Редактировать
                </Button>
                <Button
                  size="small"
                  color="error"
                  onClick={() => {
                    void (async () => {
                      if (
                        !window.confirm(
                          `Удалить шаблон «${t.title}»? Его нельзя будет выбрать в обходе.`,
                        )
                      ) {
                        return;
                      }
                      try {
                        await deleteTemplate(t.id);
                      } catch (e) {
                        console.error(e);
                      }
                    })();
                  }}
                >
                  Удалить
                </Button>
              </CardActions>
            </Card>
          ))}
        </Box>
      )}
    </Stack>
  );
}
