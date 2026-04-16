import type { ActivityLog } from "@/types";

export const mockActivityLogs: ActivityLog[] = [
  {
    id: "act-001",
    type: "task_completed",
    message: "Задача «Плановый осмотр котельной №3» отмечена как выполненная.",
    timestamp: "2026-04-15T08:12:00",
    relatedTaskId: "task-001",
  },
  {
    id: "act-002",
    type: "defect_reported",
    message: "Зарегистрирован дефект: повышенная вибрация компрессора (ВК-55).",
    timestamp: "2026-04-15T11:05:00",
    relatedTaskId: "task-002",
  },
  {
    id: "act-003",
    type: "inspection_started",
    message: "Инспектор начал обход линии сборки А.",
    timestamp: "2026-04-15T09:40:00",
    relatedTaskId: "task-002",
  },
  {
    id: "act-004",
    type: "sync_error",
    message: "Ошибка синхронизации фотоматериалов по задаче «Осмотр резервного насоса ЦНС».",
    timestamp: "2026-04-14T19:22:00",
    relatedTaskId: "task-007",
  },
  {
    id: "act-005",
    type: "note",
    message: "Супервайзер оставил примечание: ускорить проверку силовой подстанции.",
    timestamp: "2026-04-14T16:00:00",
    relatedTaskId: "task-003",
  },
  {
    id: "act-006",
    type: "defect_reported",
    message: "Новый дефект: смещение ленты конвейера на участке упаковки.",
    timestamp: "2026-04-14T15:45:00",
    relatedTaskId: "task-002",
  },
];
