import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import PlayArrowOutlinedIcon from '@mui/icons-material/PlayArrowOutlined';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Link as MuiLink,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import styles from './PlanningPage.module.scss';
import { collectEquipmentNodesByIds } from '@/features/objects/objectTreeUtils';
import { ObjectTree } from '@/features/objects/ObjectTree';
import { useObjectTree } from '@/features/objects/useObjectTree';
import { PlanPatrolModal } from '@/features/planning/PlanPatrolModal';
import { PlanningCalendar } from '@/features/planning/PlanningCalendar';
import {
  cancelPlannedInspection,
  dispatchPlannedInspectionsDue,
  fetchPlannedInspectionsInRange,
  localDayKeyFromIso,
  plannedPatrolUi,
  type PlannedInspectionBundle,
} from '@/features/planning/plannedInspectionsApi';
import { isSupabaseConfigured } from '@/shared/lib/supabase/client';

function parseDayKey(key: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const dt = new Date(y, mo, d, 9, 0, 0, 0);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

/** Склонение «N план(ов)» для чипа. */
function plannedCountLabelRu(n: number): string {
  const n100 = n % 100;
  if (n100 >= 11 && n100 <= 14) return `${n} планов`;
  const n10 = n % 10;
  if (n10 === 1) return `${n} план`;
  if (n10 >= 2 && n10 <= 4) return `${n} плана`;
  return `${n} планов`;
}

export function PlanningPage() {
  const theme = useTheme();
  const configured = isSupabaseConfigured();
  const { tree, loading: treeLoading, error: treeError } = useObjectTree();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [monthIndex, setMonthIndex] = useState(now.getMonth());
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(() =>
    localDayKeyFromIso(now.toISOString()),
  );

  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [planOpen, setPlanOpen] = useState(false);

  const [plans, setPlans] = useState<PlannedInspectionBundle[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [plansError, setPlansError] = useState<string | null>(null);

  const [dispatchMsg, setDispatchMsg] = useState<string | null>(null);
  const [dispatching, setDispatching] = useState(false);

  const range = useMemo(() => {
    const start = new Date(year, monthIndex, 1, 0, 0, 0, 0);
    const end = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
    return { startIso: start.toISOString(), endIso: end.toISOString() };
  }, [year, monthIndex]);

  const loadPlans = useCallback(async () => {
    if (!configured) {
      setPlans([]);
      return;
    }
    setPlansLoading(true);
    setPlansError(null);
    const { data, error } = await fetchPlannedInspectionsInRange(range.startIso, range.endIso);
    setPlansLoading(false);
    if (error) setPlansError(error);
    setPlans(data);
  }, [configured, range.startIso, range.endIso]);

  useEffect(() => {
    void loadPlans();
  }, [loadPlans]);

  const plansByDay = useMemo(() => {
    const m = new Map<string, PlannedInspectionBundle[]>();
    for (const p of plans) {
      const k = localDayKeyFromIso(p.scheduled_at ?? '');
      if (!k) continue;
      const arr = m.get(k) ?? [];
      arr.push(p);
      m.set(k, arr);
    }
    for (const [, arr] of m) {
      arr.sort((a, b) => {
        const ta = Date.parse(String(a.scheduled_at ?? '')) || 0;
        const tb = Date.parse(String(b.scheduled_at ?? '')) || 0;
        return ta - tb;
      });
    }
    return m;
  }, [plans]);

  const selectedNodes = useMemo(
    () => collectEquipmentNodesByIds(tree, selectedIds),
    [tree, selectedIds],
  );

  const selectedDayLabel = useMemo(() => {
    if (!selectedDayKey) return null;
    const d = parseDayKey(selectedDayKey);
    if (!d) return selectedDayKey;
    return d.toLocaleDateString('ru-RU', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, [selectedDayKey]);

  const plansForSelectedDay = selectedDayKey ? (plansByDay.get(selectedDayKey) ?? []) : [];

  const defaultWhenForModal = useMemo(() => {
    const fromKey = selectedDayKey ? parseDayKey(selectedDayKey) : null;
    if (fromKey) return fromKey;
    return new Date(year, monthIndex, 15, 9, 0, 0, 0);
  }, [selectedDayKey, year, monthIndex]);

  const onToggleSelect = useCallback((id: string, selected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (selected) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const goToToday = useCallback(() => {
    const t = new Date();
    setYear(t.getFullYear());
    setMonthIndex(t.getMonth());
    setSelectedDayKey(localDayKeyFromIso(t.toISOString()));
  }, []);

  const handleDispatchDue = async () => {
    setDispatchMsg(null);
    setDispatching(true);
    try {
      const { data, error } = await dispatchPlannedInspectionsDue();
      if (error) {
        setDispatchMsg(error);
        return;
      }
      setDispatchMsg(`Выдано заданий: ${data}.`);
      await loadPlans();
    } finally {
      setDispatching(false);
    }
  };

  const handleCancelPlan = async (id: string) => {
    const { error } = await cancelPlannedInspection(id);
    if (error) {
      setPlansError(error);
      return;
    }
    await loadPlans();
  };

  return (
    <Stack spacing={3} className={styles.page}>
      <Box
        sx={{
          borderRadius: 3,
          p: { xs: 2.5, sm: 3 },
          background:
            theme.palette.mode === 'light'
              ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.09)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 45%, ${theme.palette.background.paper} 100%)`
              : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.18)} 0%, ${alpha(theme.palette.primary.dark, 0.06)} 50%, ${theme.palette.background.paper} 100%)`,
          border: '1px solid',
          borderColor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.12 : 0.22),
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="overline" color="primary" fontWeight={800} letterSpacing={1.2} sx={{ display: 'block', mb: 0.5 }}>
            Расписание
          </Typography>
          <Typography variant="h4" component="h1" fontWeight={800} sx={{ letterSpacing: -0.5, mb: 1 }}>
            Планирование обходов
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 640, lineHeight: 1.65 }}>
            Выберите оборудование в дереве, исполнителя и время выдачи. После автоматической выдачи задание
            появится у обходчика в мобильном приложении. В календаре отображаются статусы: запланировано, выдано,
            в работе и выполнено.
          </Typography>
        </Box>
      </Box>

      {!configured ? (
        <Alert severity="warning">
          Сохранение расписания недоступно: не настроено подключение к данным. Обратитесь к администратору
          системы.
        </Alert>
      ) : null}

      {plansError ? (
        <Alert severity="error" onClose={() => setPlansError(null)}>
          {plansError}
        </Alert>
      ) : null}

      {dispatchMsg ? (
        <Alert
          severity={dispatchMsg.startsWith('Выдано') ? 'success' : 'error'}
          onClose={() => setDispatchMsg(null)}
        >
          {dispatchMsg}
        </Alert>
      ) : null}

      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2.5} alignItems="stretch">
        <Box sx={{ flex: { lg: '1 1 52%' }, minWidth: 0 }}>
          <PlanningCalendar
            year={year}
            monthIndex={monthIndex}
            plansByDay={plansByDay}
            selectedDayKey={selectedDayKey}
            onSelectDay={setSelectedDayKey}
            onToday={goToToday}
            onPrevMonth={() => {
              setMonthIndex((m) => {
                if (m === 0) {
                  setYear((y) => y - 1);
                  return 11;
                }
                return m - 1;
              });
            }}
            onNextMonth={() => {
              setMonthIndex((m) => {
                if (m === 11) {
                  setYear((y) => y + 1);
                  return 0;
                }
                return m + 1;
              });
            }}
          />
          {plansLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={28} />
            </Box>
          ) : null}
        </Box>

        <Card
          elevation={0}
          sx={{
            flex: { lg: '1 1 48%' },
            minWidth: 0,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            boxShadow: theme.palette.mode === 'light' ? '0 8px 30px rgba(0,0,0,0.06)' : '0 8px 30px rgba(0,0,0,0.25)',
          }}
        >
          <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
            <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 2 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: alpha(theme.palette.primary.main, 0.12),
                  color: 'primary.main',
                }}
              >
                <AccountTreeOutlinedIcon />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle1" fontWeight={800}>
                  Объекты и новый план
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  Выбранная дата:{' '}
                  <strong>{selectedDayLabel ?? selectedDayKey ?? '—'}</strong>
                </Typography>
              </Box>
            </Stack>

            <Paper
              variant="outlined"
              sx={{
                p: 1.5,
                mb: 2,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.03 : 0.06),
                borderColor: alpha(theme.palette.primary.main, 0.15),
              }}
            >
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.25, lineHeight: 1.5 }}>
                Отметьте оборудование в дереве ниже, затем запланируйте обход. Время выдачи задаётся в форме
                (можно отличать от выбранного в календаре дня).
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <Button
                  variant="contained"
                  size="medium"
                  disabled={!configured || selectedNodes.length < 1}
                  onClick={() => setPlanOpen(true)}
                  sx={{ fontWeight: 700, borderRadius: 2, textTransform: 'none' }}
                >
                  Запланировать обход…
                </Button>
                <Button
                  variant="outlined"
                  size="medium"
                  startIcon={dispatching ? <CircularProgress size={18} /> : <PlayArrowOutlinedIcon />}
                  disabled={!configured || dispatching}
                  onClick={() => void handleDispatchDue()}
                  sx={{ borderRadius: 2, textTransform: 'none' }}
                >
                  Выдать просроченные сейчас
                </Button>
              </Stack>
            </Paper>

            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5, lineHeight: 1.5 }}>
              Просроченные планы можно выдать вручную кнопкой выше. Регулярная автоматическая выдача настраивается
              на сервере организации.
            </Typography>
            <ObjectTree
              tree={tree}
              loading={treeLoading}
              error={treeError}
              selectedIds={selectedIds}
              onToggleSelect={onToggleSelect}
              onEquipmentClick={() => {
                /* карточка оборудования на странице планирования не используется */
              }}
            />
          </CardContent>
        </Card>
      </Stack>

      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
          boxShadow: theme.palette.mode === 'light' ? '0 4px 24px rgba(0,0,0,0.05)' : 'none',
        }}
      >
        <Box
          sx={{
            px: 2.5,
            py: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            background:
              theme.palette.mode === 'light'
                ? alpha(theme.palette.primary.main, 0.04)
                : alpha(theme.palette.primary.main, 0.08),
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between" flexWrap="wrap" useFlexGap>
            <Stack direction="row" spacing={1} alignItems="center">
              <ScheduleOutlinedIcon color="primary" />
              <Typography variant="subtitle1" fontWeight={800}>
                На выбранный день
              </Typography>
            </Stack>
            {selectedDayKey ? (
              <Chip size="small" label={plannedCountLabelRu(plansForSelectedDay.length)} sx={{ fontWeight: 700 }} />
            ) : null}
          </Stack>
        </Box>
        <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
          {selectedDayKey == null ? (
            <Stack alignItems="center" sx={{ py: 4, textAlign: 'center' }}>
              <AutoAwesomeOutlinedIcon sx={{ fontSize: 40, color: 'action.disabled', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                Выберите дату в календаре слева.
              </Typography>
            </Stack>
          ) : plansForSelectedDay.length === 0 ? (
            <Stack alignItems="center" sx={{ py: 4, textAlign: 'center' }}>
              <EventAvailableOutlinedIcon sx={{ fontSize: 40, color: 'action.disabled', mb: 1 }} />
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360 }}>
                На эту дату планов нет. Отметьте оборудование и нажмите «Запланировать обход».
              </Typography>
            </Stack>
          ) : (
            <Stack spacing={1.5}>
              {plansForSelectedDay.map((p) => {
                const id = String(p.id ?? '');
                const ui = plannedPatrolUi(p);
                const t = p.scheduled_at
                  ? new Date(p.scheduled_at).toLocaleString('ru-RU', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '—';
                const itemsCount = (p.planned_inspection_items ?? []).length;
                const canCancel = String(p.status) === 'scheduled';
                return (
                  <PaperLikeRow key={id || t}>
                    <Stack direction="row" spacing={1.5} alignItems="stretch">
                      <Box
                        sx={{
                          width: 4,
                          borderRadius: 1,
                          flexShrink: 0,
                          bgcolor:
                            ui.kind === 'scheduled_overdue'
                              ? 'error.main'
                              : ui.kind === 'dispatched_done'
                                ? 'success.main'
                                : ui.kind === 'dispatched_issues'
                                  ? 'warning.main'
                                  : 'primary.main',
                          opacity: 0.85,
                        }}
                      />
                      <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={1}
                        alignItems={{ xs: 'flex-start', sm: 'center' }}
                        justifyContent="space-between"
                        sx={{ flex: 1, minWidth: 0 }}
                      >
                        <Box>
                          <Typography variant="body2" fontWeight={800} sx={{ mb: 0.25 }}>
                            {p.title ?? 'Без названия'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Выдача: {t} · пунктов: {itemsCount}
                          </Typography>
                          {p.dispatched_task_id ? (
                            <MuiLink
                              component={RouterLink}
                              to={`/tasks/${String(p.dispatched_task_id)}`}
                              variant="caption"
                              fontWeight={600}
                              sx={{ mt: 0.5, display: 'inline-block' }}
                            >
                              Открыть задание →
                            </MuiLink>
                          ) : null}
                        </Box>
                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                          <Chip size="small" label={ui.label} color={ui.color} variant="outlined" sx={{ fontWeight: 600 }} />
                          {canCancel ? (
                            <Button
                              size="small"
                              color="warning"
                              variant="outlined"
                              onClick={() => void handleCancelPlan(id)}
                              sx={{ textTransform: 'none', borderRadius: 1.5 }}
                            >
                              Отменить план
                            </Button>
                          ) : null}
                        </Stack>
                      </Stack>
                    </Stack>
                  </PaperLikeRow>
                );
              })}
            </Stack>
          )}
        </CardContent>
      </Card>

      <PlanPatrolModal
        open={planOpen}
        onClose={() => setPlanOpen(false)}
        selectedNodes={selectedNodes}
        defaultWhen={defaultWhenForModal}
        onCreated={() => void loadPlans()}
      />
    </Stack>
  );
}

function PaperLikeRow({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return (
    <Box
      sx={{
        p: 1.75,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        transition: theme.transitions.create(['box-shadow', 'border-color'], {
          duration: theme.transitions.duration.short,
        }),
        '&:hover': {
          borderColor: alpha(theme.palette.primary.main, 0.35),
          boxShadow: `0 6px 20px ${alpha(theme.palette.common.black, theme.palette.mode === 'light' ? 0.06 : 0.2)}`,
        },
      }}
    >
      {children}
    </Box>
  );
}
