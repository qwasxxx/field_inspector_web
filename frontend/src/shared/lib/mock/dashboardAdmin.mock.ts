import type {
  CriticalDefectAlert,
  DashboardEmployee,
  DashboardMetric,
  ShiftContext,
  ShiftEvent,
  ShiftProgressItem,
} from '@/entities/dashboard/model/types';

export const SHIFT_CONTEXT_MOCK: ShiftContext = {
  shiftNumber: '482',
  dateLabel: 'Сегодня, 16 апреля 2026',
  siteLabel: 'Энергоцех №3, площадка Томинская',
  onlineCurrent: 4,
  onlineTotal: 5,
};

export const CRITICAL_DEFECT_ALERT_MOCK: CriticalDefectAlert = {
  id: 'alert-1',
  message:
    'Критический дефект: Трансформатор ТМ-630, объект Э-114 — перегрев обмотки.',
  time: '14:32',
  objectRef: 'Э-114',
};

export const DASHBOARD_METRICS_MOCK: DashboardMetric[] = [
  {
    id: 'm1',
    title: 'Выполнено объектов',
    value: '18 / 26',
    caption: '69% смены',
  },
  {
    id: 'm2',
    title: 'Активных обходчиков',
    value: '4',
    caption: '1 на связи нет 12 мин',
  },
  {
    id: 'm3',
    title: 'Дефектов за смену',
    value: '3',
    caption: '1 критический',
  },
  {
    id: 'm4',
    title: 'Ср. время на объект',
    value: '14 мин',
    caption: 'норма: 12 мин',
  },
];

export const EMPLOYEES_ON_SHIFT_MOCK: DashboardEmployee[] = [
  {
    id: 'e1',
    name: 'Петров Д.О.',
    initials: 'ПД',
    status: 'defect',
    statusLabel: 'Дефект',
    locationHint: 'Э-114 · 14:28',
  },
  {
    id: 'e2',
    name: 'Котов А.В.',
    initials: 'КА',
    status: 'in_work',
    statusLabel: 'В работе',
    locationHint: 'Э-109',
  },
  {
    id: 'e3',
    name: 'Михайлов И.С.',
    initials: 'МИ',
    status: 'in_work',
    statusLabel: 'В работе',
    locationHint: 'Насосная',
  },
  {
    id: 'e4',
    name: 'Сидоров П.К.',
    initials: 'СП',
    status: 'offline',
    statusLabel: 'Нет связи',
    locationHint: '12 мин',
  },
  {
    id: 'e5',
    name: 'Орлов В.Н.',
    initials: 'ОВ',
    status: 'break',
    statusLabel: 'Перерыв',
    locationHint: 'Столовая',
  },
];

export const SHIFT_EVENTS_MOCK: ShiftEvent[] = [
  {
    id: 'ev1',
    time: '14:32',
    title: 'Критический дефект',
    detail:
      'Трансформатор ТМ-630 (обходчик: Петров Д.О., фото прикреплено).',
    type: 'defect_critical',
  },
  {
    id: 'ev2',
    time: '13:58',
    title: 'Обход завершён',
    detail: 'Объект Э-109 (Котов А.В., 11 параметров в норме).',
    type: 'inspection_done',
  },
  {
    id: 'ev3',
    time: '13:41',
    title: 'Отклонение давления',
    detail: 'Насос НС-4 (Михайлов И.С., 4.8 атм, норма 5.2).',
    type: 'deviation',
  },
  {
    id: 'ev4',
    time: '13:20',
    title: 'Смена начата',
    detail: '5 сотрудников, 26 объектов.',
    type: 'shift_start',
  },
  {
    id: 'ev5',
    time: '13:18',
    title: 'Синхронизация устройств',
    detail: 'Офлайн-данные выгружены.',
    type: 'sync',
  },
];

export const SHIFT_PROGRESS_MOCK: ShiftProgressItem[] = [
  { id: 'p1', name: 'Котов А.В.', current: 6, total: 8 },
  { id: 'p2', name: 'Петров Д.О.', current: 5, total: 8 },
  { id: 'p3', name: 'Михайлов И.С.', current: 3, total: 6 },
  { id: 'p4', name: 'Сидоров П.К.', current: 2, total: 6 },
];
