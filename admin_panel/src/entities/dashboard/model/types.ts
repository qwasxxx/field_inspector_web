/** Статус сотрудника на смене (как на панели администратора) */
export type EmployeeShiftStatus =
  | 'in_work'
  | 'defect'
  | 'offline'
  | 'break';

export type DashboardEmployee = {
  id: string;
  name: string;
  initials: string;
  status: EmployeeShiftStatus;
  statusLabel: string;
  locationHint: string;
};

export type ShiftEventType =
  | 'defect_critical'
  | 'inspection_done'
  | 'deviation'
  | 'shift_start'
  | 'sync';

export type ShiftEvent = {
  id: string;
  time: string;
  title: string;
  detail: string;
  type: ShiftEventType;
};

export type DashboardMetric = {
  id: string;
  title: string;
  value: string;
  caption: string;
};

export type ShiftProgressItem = {
  id: string;
  name: string;
  current: number;
  total: number;
};

export type CriticalDefectAlert = {
  id: string;
  message: string;
  time: string;
  objectRef: string;
};

export type ShiftContext = {
  shiftNumber: string;
  dateLabel: string;
  siteLabel: string;
  onlineCurrent: number;
  onlineTotal: number;
};
