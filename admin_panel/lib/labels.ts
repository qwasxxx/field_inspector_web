import type {
  DefectSeverity,
  DefectStatus,
  EquipmentCategory,
  EquipmentStatus,
  SyncStatus,
  TaskStatus,
} from "@/types";

export function taskStatusLabel(status: TaskStatus): string {
  const map: Record<TaskStatus, string> = {
    completed: "Выполнено",
    in_progress: "В процессе",
    pending: "Ожидает",
    issue: "Есть проблема",
  };
  return map[status];
}

export function defectStatusLabel(status: DefectStatus): string {
  const map: Record<DefectStatus, string> = {
    open: "Открыт",
    review: "На проверке",
    resolved: "Решено",
  };
  return map[status];
}

export function defectSeverityLabel(severity: DefectSeverity): string {
  const map: Record<DefectSeverity, string> = {
    low: "Низкая",
    medium: "Средняя",
    high: "Высокая",
    critical: "Критическая",
  };
  return map[severity];
}

export function equipmentCategoryLabel(cat: EquipmentCategory): string {
  const map: Record<EquipmentCategory, string> = {
    pump: "Насос",
    compressor: "Компрессор",
    transformer: "Трансформатор",
    conveyor: "Конвейер",
    valve: "Арматура",
    motor: "Двигатель",
  };
  return map[cat];
}

export function equipmentStatusLabel(status: EquipmentStatus): string {
  const map: Record<EquipmentStatus, string> = {
    operational: "В норме",
    attention: "Требует внимания",
    stopped: "Остановлено",
  };
  return map[status];
}

export function syncStatusLabel(status: SyncStatus): string {
  const map: Record<SyncStatus, string> = {
    synced: "Синхронизировано",
    pending: "В очереди",
    error: "Ошибка",
  };
  return map[status];
}
