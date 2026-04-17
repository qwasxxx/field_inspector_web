import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Box, Button, IconButton, Paper, Stack, Tooltip, Typography, useTheme } from '@mui/material';
import { alpha, type SxProps, type Theme } from '@mui/material/styles';
import type { PlannedInspectionBundle } from './plannedInspectionsApi';
import { localDayKeyFromIso, plannedPatrolUi } from './plannedInspectionsApi';

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

function monthLabel(year: number, monthIndex: number): string {
  return new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' }).format(
    new Date(year, monthIndex, 1),
  );
}

/** Пн = 0 … Вс = 6 */
function mondayIndex(d: Date): number {
  return (d.getDay() + 6) % 7;
}

function buildMonthGrid(year: number, monthIndex: number): (number | null)[][] {
  const first = new Date(year, monthIndex, 1);
  const lead = mondayIndex(first);
  const dim = new Date(year, monthIndex + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let d = 1; d <= dim; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }
  return rows;
}

function dayKey(year: number, monthIndex: number, day: number): string {
  const m = String(monthIndex + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

function dotSxForKind(
  kind: ReturnType<typeof plannedPatrolUi>['kind'],
  theme: Theme,
): SxProps<Theme> {
  const base = {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flexShrink: 0,
  };
  switch (kind) {
    case 'cancelled':
      return { ...base, bgcolor: theme.palette.action.disabledBackground };
    case 'scheduled':
      return { ...base, bgcolor: theme.palette.primary.main };
    case 'scheduled_overdue':
      return { ...base, bgcolor: theme.palette.error.main };
    case 'dispatched_assigned':
    case 'dispatched_progress':
      return { ...base, bgcolor: theme.palette.info.main };
    case 'dispatched_done':
      return { ...base, bgcolor: theme.palette.success.main };
    case 'dispatched_issues':
      return { ...base, bgcolor: theme.palette.warning.main };
    default:
      return { ...base, bgcolor: theme.palette.grey[400] };
  }
}

export type PlanningCalendarProps = {
  year: number;
  monthIndex: number;
  plansByDay: Map<string, PlannedInspectionBundle[]>;
  selectedDayKey: string | null;
  onSelectDay: (dayKey: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  /** Перейти к текущей дате и выделить сегодня */
  onToday: () => void;
};

export function PlanningCalendar({
  year,
  monthIndex,
  plansByDay,
  selectedDayKey,
  onSelectDay,
  onPrevMonth,
  onNextMonth,
  onToday,
}: PlanningCalendarProps) {
  const theme = useTheme();
  const grid = buildMonthGrid(year, monthIndex);
  const todayKey = localDayKeyFromIso(new Date().toISOString());

  return (
    <Paper
      variant="outlined"
      elevation={0}
      sx={{
        borderRadius: 3,
        overflow: 'hidden',
        boxShadow:
          theme.palette.mode === 'light'
            ? '0 10px 40px rgba(0,0,0,0.07)'
            : '0 12px 40px rgba(0,0,0,0.35)',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1,
          px: 2,
          py: 1.75,
          borderBottom: '1px solid',
          borderColor: 'divider',
          background: `linear-gradient(90deg, ${alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.08 : 0.14)} 0%, transparent 55%)`,
        }}
      >
        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(theme.palette.primary.main, 0.12),
              color: 'primary.main',
            }}
          >
            <CalendarMonthOutlinedIcon sx={{ fontSize: 26 }} />
          </Box>
          <Typography
            variant="h6"
            component="h2"
            fontWeight={800}
            sx={{ textTransform: 'capitalize', lineHeight: 1.2, letterSpacing: -0.3 }}
          >
            {monthLabel(year, monthIndex)}
          </Typography>
        </Stack>
        <Stack direction="row" spacing={0.75} alignItems="center">
          <Button
            size="small"
            variant="contained"
            onClick={onToday}
            disableElevation
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, px: 1.5 }}
          >
            Сегодня
          </Button>
          <IconButton aria-label="предыдущий месяц" onClick={onPrevMonth} size="small" color="primary" sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <ChevronLeftIcon />
          </IconButton>
          <IconButton aria-label="следующий месяц" onClick={onNextMonth} size="small" color="primary" sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <ChevronRightIcon />
          </IconButton>
        </Stack>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
          gap: 0,
          bgcolor: 'divider',
        }}
      >
        {WEEKDAYS.map((w, wi) => (
          <Box
            key={w}
            sx={{
              py: 1.1,
              textAlign: 'center',
              bgcolor: wi >= 5 ? alpha(theme.palette.action.hover, 0.45) : 'background.paper',
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={800}
              letterSpacing={0.8}
              sx={{ fontSize: '0.68rem', textTransform: 'uppercase' }}
            >
              {w}
            </Typography>
          </Box>
        ))}

        {grid.flatMap((week, wi) =>
          week.map((day, di) => {
            const idx = wi * 7 + di;
            if (day == null) {
              return (
                <Box
                  key={`e-${idx}`}
                  sx={{
                    minHeight: { xs: 88, sm: 108 },
                    bgcolor: 'action.hover',
                    borderRight: di < 6 ? '1px solid' : 'none',
                    borderColor: 'divider',
                    borderBottom: wi < grid.length - 1 ? '1px solid' : 'none',
                  }}
                />
              );
            }
            const key = dayKey(year, monthIndex, day);
            const list = plansByDay.get(key) ?? [];
            const selected = selectedDayKey === key;
            const isToday = todayKey === key;
            const isWeekend = di >= 5;

            const tooltipTitle =
              list.length === 0
                ? `${day} — нет планов`
                : list
                    .map((p) => {
                      const ui = plannedPatrolUi(p);
                      return `• ${(p.title ?? 'Обход').trim()} — ${ui.label}`;
                    })
                    .join('\n');

            const dots = list.slice(0, 4).map((p, i) => {
              const ui = plannedPatrolUi(p);
              return (
                <Box
                  key={p.id ?? i}
                  component="span"
                  sx={dotSxForKind(ui.kind, theme)}
                  aria-hidden
                />
              );
            });
            const overflow = list.length > 4 ? list.length - 4 : 0;

            return (
              <Tooltip title={<span style={{ whiteSpace: 'pre-line' }}>{tooltipTitle}</span>} enterDelay={400}>
                <Box
                  key={key}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectDay(key)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectDay(key);
                    }
                  }}
                  sx={{
                    minHeight: { xs: 88, sm: 112 },
                    p: { xs: 0.75, sm: 1 },
                    cursor: 'pointer',
                    bgcolor: selected
                      ? 'action.selected'
                      : isWeekend
                        ? alpha(theme.palette.action.hover, theme.palette.mode === 'light' ? 0.35 : 0.2)
                        : 'background.paper',
                    borderRight: di < 6 ? '1px solid' : 'none',
                    borderColor: 'divider',
                    borderBottom: wi < grid.length - 1 ? '1px solid' : 'none',
                    transition: theme.transitions.create(['background-color', 'box-shadow'], {
                      duration: theme.transitions.duration.shortest,
                    }),
                    '&:hover': {
                      bgcolor: selected
                        ? 'action.selected'
                        : alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.06 : 0.12),
                    },
                    ...(isToday && {
                      boxShadow: `inset 0 0 0 2px ${theme.palette.primary.main}`,
                    }),
                  }}
                >
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 0.5,
                      ...(isToday && {
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                      }),
                      ...(selected &&
                        !isToday && {
                          bgcolor: 'primary.light',
                          color: 'primary.contrastText',
                          ...theme.applyStyles?.('dark', {
                            bgcolor: 'primary.dark',
                          }),
                        }),
                    }}
                  >
                    <Typography
                      variant="body1"
                      fontWeight={isToday || selected ? 800 : 600}
                      sx={{
                        ...(!isToday && !selected && { color: 'text.primary' }),
                      }}
                    >
                      {day}
                    </Typography>
                  </Box>
                  {list.length > 0 ? (
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ gap: 0.5 }}>
                      {dots}
                      {overflow > 0 ? (
                        <Typography variant="caption" color="text.secondary" fontWeight={700}>
                          +{overflow}
                        </Typography>
                      ) : null}
                    </Stack>
                  ) : (
                    <Typography variant="caption" color="text.disabled" sx={{ opacity: 0.6 }}>
                      —
                    </Typography>
                  )}
                </Box>
              </Tooltip>
            );
          }),
        )}
      </Box>

      <Box
        sx={{
          px: 2,
          py: 1.5,
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: alpha(theme.palette.divider, theme.palette.mode === 'light' ? 0.06 : 0.12),
        }}
      >
        <Typography variant="caption" color="text.secondary" fontWeight={800} display="block" sx={{ mb: 1, letterSpacing: 0.6, textTransform: 'uppercase', fontSize: '0.65rem' }}>
          Обозначения
        </Typography>
        <Stack direction="row" flexWrap="wrap" useFlexGap spacing={0.75} sx={{ gap: 0.75 }}>
          {[
            { k: 'scheduled' as const, label: 'Запланирован' },
            { k: 'scheduled_overdue' as const, label: 'Не выдан' },
            { k: 'dispatched_assigned' as const, label: 'Выдан' },
            { k: 'dispatched_progress' as const, label: 'В работе' },
            { k: 'dispatched_done' as const, label: 'Выполнен' },
            { k: 'dispatched_issues' as const, label: 'С замечаниями' },
          ].map(({ k, label }) => (
            <Stack
              key={k}
              direction="row"
              spacing={0.75}
              alignItems="center"
              sx={{
                px: 1,
                py: 0.35,
                borderRadius: 10,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Box sx={dotSxForKind(k, theme)} />
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                {label}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Box>
    </Paper>
  );
}
