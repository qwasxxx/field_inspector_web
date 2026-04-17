/** Подписи параметров для вкладки «Текущие данные» */
export const PARAM_LABELS: Record<string, string> = {
  voltage_l1: 'Напряжение L1 (В)',
  voltage_l2: 'Напряжение L2 (В)',
  voltage_l3: 'Напряжение L3 (В)',
  current_a: 'Ток (А)',
  temperature_oil: 'Температура масла (°C)',
  temperature_winding: 'Температура обмотки (°C)',
  load_percent: 'Нагрузка (%)',
  pressure: 'Давление',
  vibration: 'Вибрация',
  temperature: 'Температура',
  pressure_bar: 'Давление (бар)',
  flow_m3h: 'Расход (м³/ч)',
  rpm: 'Обороты (об/мин)',
  vibration_mm_s: 'Вибрация (мм/с)',
};

export function labelForParam(key: string): string {
  return PARAM_LABELS[key] ?? key;
}
