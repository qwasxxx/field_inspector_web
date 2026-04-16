import type { InspectionTaskDetail } from "@/types";
import { mockDefects } from "./defects";
import { getEquipmentById } from "./equipment";
import { getTaskById } from "./tasks";
import { getUserById } from "./users";

const detailOverrides: Record<string, Partial<InspectionTaskDetail>> = {
  "task-001": {
    routeDescription:
      "Маршрут: вход в котельную → узел учёта → насосная группа → дымоходная зона.",
    equipmentIds: ["eq-001", "eq-005"],
    checklist: [
      {
        id: "ch-1",
        label: "Целостность ограждений и предупреждающей маркировки",
        passed: true,
        notes: null,
      },
      {
        id: "ch-2",
        label: "Отсутствие подтёков на уплотнениях насосов",
        passed: false,
        notes: "Зафиксирован локальный подтёк на ПН-12.",
      },
      {
        id: "ch-3",
        label: "Показания манометров в допустимых пределах",
        passed: true,
        notes: null,
      },
      {
        id: "ch-4",
        label: "Работоспособность аварийной сигнализации",
        passed: true,
        notes: null,
      },
    ],
    measurements: [
      {
        id: "m-1",
        name: "Давление на выходе насоса",
        unit: "бар",
        value: 6.2,
        normMin: 5.5,
        normMax: 6.8,
        withinNorm: true,
      },
      {
        id: "m-2",
        name: "Температура подшипника",
        unit: "°C",
        value: 68,
        normMin: 40,
        normMax: 75,
        withinNorm: true,
      },
    ],
    photos: [
      {
        id: "ph-1",
        caption: "Общий вид узла насосной группы",
        takenAt: "2026-04-14T15:10:00",
      },
      {
        id: "ph-2",
        caption: "Место подтёка сальника ПН-12",
        takenAt: "2026-04-14T15:18:00",
      },
    ],
    linkedDefectIds: ["def-001"],
    syncMessage: "Все данные успешно отправлены на сервер.",
  },
  "task-002": {
    routeDescription:
      "Маршрут: ввод в цех → линия сборки А → пост контроля качества → упаковка.",
    equipmentIds: ["eq-002", "eq-004", "eq-009", "eq-010"],
    checklist: [
      {
        id: "ch-1",
        label: "Крепление защитных кожухов приводов",
        passed: true,
        notes: null,
      },
      {
        id: "ch-2",
        label: "Состояние аварийных остановов",
        passed: true,
        notes: null,
      },
      {
        id: "ch-3",
        label: "Отсутствие посторонних предметов на траектории конвейера",
        passed: false,
        notes: "Обнаружена посторонняя деталь у поста 4.",
      },
    ],
    measurements: [
      {
        id: "m-1",
        name: "Вибрация корпуса компрессора",
        unit: "мм/с",
        value: 7.8,
        normMin: 0,
        normMax: 4.5,
        withinNorm: false,
      },
      {
        id: "m-2",
        name: "Ток двигателя конвейера",
        unit: "А",
        value: 32,
        normMin: 28,
        normMax: 38,
        withinNorm: true,
      },
    ],
    photos: [
      {
        id: "ph-1",
        caption: "Панель вибромониторинга ВК-55",
        takenAt: "2026-04-15T10:20:00",
      },
      {
        id: "ph-2",
        caption: "Участок конвейера, линия 4",
        takenAt: "2026-04-15T10:45:00",
      },
      {
        id: "ph-3",
        caption: "Задвижка на трубопроводе пара",
        takenAt: "2026-04-15T11:10:00",
      },
    ],
    linkedDefectIds: ["def-002", "def-009", "def-010"],
    syncMessage: "Ожидается завершение загрузки вложений (2 из 3).",
  },
};

function defaultDetailFor(taskId: string): Partial<InspectionTaskDetail> {
  const base = getTaskById(taskId);
  if (!base) return {};
  const defectsForTask = mockDefects.filter((d) => d.taskId === taskId);
  return {
    routeDescription: `Маршрут осмотра: объект «${base.site}», стандартный чек-лист.`,
    equipmentIds: defectsForTask.length
      ? [...new Set(defectsForTask.map((d) => d.equipmentId))]
      : ["eq-003"],
    checklist: [
      {
        id: "ch-d1",
        label: "Визуальный осмотр без замечаний",
        passed: base.status !== "issue",
        notes: base.status === "issue" ? "Требуется повторный контроль." : null,
      },
      {
        id: "ch-d2",
        label: "Фиксация показаний контрольно-измерительных приборов",
        passed: true,
        notes: null,
      },
    ],
    measurements: [
      {
        id: "m-d1",
        name: "Контрольный параметр А",
        unit: "ед.",
        value: 1,
        normMin: 0,
        normMax: 2,
        withinNorm: true,
      },
    ],
    photos: defectsForTask.some((d) => d.hasPhotos)
      ? [
          {
            id: "ph-d1",
            caption: "Фотоотчёт по объекту",
            takenAt: `${base.dueDate}T12:00:00`,
          },
        ]
      : [],
    linkedDefectIds: defectsForTask.map((d) => d.id),
    syncMessage:
      base.syncStatus === "synced"
        ? "Синхронизация завершена."
        : base.syncStatus === "pending"
          ? "Данные в очереди на отправку."
          : "Ошибка синхронизации, требуется повтор.",
  };
}

export function getTaskDetail(taskId: string): InspectionTaskDetail | null {
  const task = getTaskById(taskId);
  if (!task) return null;
  const assignee = getUserById(task.assigneeId);
  if (!assignee) return null;

  const defaults = defaultDetailFor(taskId);
  const override = detailOverrides[taskId];

  const merged: InspectionTaskDetail = {
    ...task,
    assignee,
    routeDescription: override?.routeDescription ?? defaults.routeDescription ?? "",
    equipmentIds: override?.equipmentIds ?? defaults.equipmentIds ?? [],
    checklist: override?.checklist ?? defaults.checklist ?? [],
    measurements: override?.measurements ?? defaults.measurements ?? [],
    photos: override?.photos ?? defaults.photos ?? [],
    linkedDefectIds: override?.linkedDefectIds ?? defaults.linkedDefectIds ?? [],
    syncMessage: override?.syncMessage ?? defaults.syncMessage ?? "",
  };

  return merged;
}

export function getEquipmentNamesForTask(detail: InspectionTaskDetail): string[] {
  return detail.equipmentIds
    .map((id) => getEquipmentById(id)?.name ?? id)
    .filter(Boolean);
}
