import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { SectionCard } from "@/components/ui/SectionCard";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  getDefectById,
  getEquipmentById,
  getTaskDetail,
} from "@/lib/data/mock";

type PageProps = {
  params: Promise<{ taskId: string }>;
};

export default async function TaskDetailPage({ params }: PageProps) {
  const { taskId } = await params;
  const detail = getTaskDetail(taskId);
  if (!detail) notFound();

  const equipmentList = detail.equipmentIds
    .map((id) => getEquipmentById(id))
    .filter(Boolean);

  const defects = detail.linkedDefectIds
    .map((id) => getDefectById(id))
    .filter(Boolean);

  return (
    <AppShell
      title={detail.title}
      subtitle={`${detail.site} · срок ${new Date(detail.dueDate).toLocaleDateString("ru-RU")}`}
    >
      <div className="mb-6">
        <Link
          href="/tasks"
          className="text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          ← Назад к списку задач
        </Link>
      </div>

      <div className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-3">
          <SectionCard title="Сводка по задаче" description="Статус и прогресс">
            <dl className="grid gap-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-600">Статус</dt>
                <dd>
                  <StatusBadge variant="task" value={detail.status} />
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-600">Готовность</dt>
                <dd className="font-medium tabular-nums text-slate-900">
                  {detail.progressPercent}%
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-600">Синхронизация</dt>
                <dd>
                  <StatusBadge variant="sync" value={detail.syncStatus} />
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-600">Завершено</dt>
                <dd className="text-slate-800">
                  {detail.completedAt
                    ? new Date(detail.completedAt).toLocaleString("ru-RU")
                    : "—"}
                </dd>
              </div>
            </dl>
          </SectionCard>

          <SectionCard
            title="Назначенный инспектор"
            description="Ответственный за полевой осмотр"
          >
            <p className="text-base font-semibold text-slate-900">
              {detail.assignee.name}
            </p>
            <p className="mt-1 text-sm text-slate-600">{detail.assignee.email}</p>
          </SectionCard>

          <SectionCard
            title="Маршрут и синхронизация"
            description="Описание обхода и состояние выгрузки данных"
          >
            <p className="text-sm text-slate-800">{detail.routeDescription}</p>
            <p className="mt-3 text-xs text-slate-600">{detail.syncMessage}</p>
          </SectionCard>
        </div>

        <SectionCard
          title="Оборудование на маршруте"
          description="Объекты, включённые в эту задачу"
        >
          <ul className="divide-y divide-slate-100">
            {equipmentList.map((eq) =>
              eq ? (
                <li
                  key={eq.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0"
                >
                  <div>
                    <span className="font-medium text-slate-900">{eq.name}</span>
                    <div className="text-xs text-slate-500">{eq.location}</div>
                  </div>
                  <span className="text-xs text-slate-500">{eq.serialNumber}</span>
                </li>
              ) : null,
            )}
          </ul>
        </SectionCard>

        <div className="grid gap-6 lg:grid-cols-2">
          <SectionCard title="Результаты чек-листа" description="Контрольные пункты">
            <ul className="space-y-3">
              {detail.checklist.map((item) => (
                <li
                  key={item.id}
                  className="rounded-md border border-slate-100 bg-slate-50/80 px-3 py-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm text-slate-800">{item.label}</span>
                    <span
                      className={`shrink-0 text-xs font-medium ${
                        item.passed ? "text-emerald-700" : "text-rose-700"
                      }`}
                    >
                      {item.passed ? "Норма" : "Замечание"}
                    </span>
                  </div>
                  {item.notes ? (
                    <p className="mt-1 text-xs text-slate-600">{item.notes}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title="Измерения" description="Значения и допуски">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs text-slate-600">
                    <th className="py-2 pr-4 font-medium">Параметр</th>
                    <th className="py-2 pr-4 font-medium">Значение</th>
                    <th className="py-2 pr-4 font-medium">Норма</th>
                    <th className="py-2 font-medium">Оценка</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {detail.measurements.map((m) => (
                    <tr key={m.id}>
                      <td className="py-2 pr-4 text-slate-800">{m.name}</td>
                      <td className="py-2 pr-4 tabular-nums text-slate-900">
                        {m.value} {m.unit}
                      </td>
                      <td className="py-2 pr-4 tabular-nums text-slate-600">
                        {m.normMin}–{m.normMax} {m.unit}
                      </td>
                      <td className="py-2 text-sm">
                        {m.withinNorm ? (
                          <span className="text-emerald-700">В пределах</span>
                        ) : (
                          <span className="text-rose-700">Вне нормы</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <SectionCard
            title="Фотоматериалы"
            description="Вложения из мобильного приложения (имитация)"
          >
            <ul className="space-y-3">
              {detail.photos.map((p) => (
                <li
                  key={p.id}
                  className="flex items-start justify-between gap-3 rounded-md border border-slate-100 px-3 py-2"
                >
                  <div>
                    <div className="text-sm font-medium text-slate-900">
                      {p.caption}
                    </div>
                    <div className="text-xs text-slate-500">
                      {new Date(p.takenAt).toLocaleString("ru-RU")}
                    </div>
                  </div>
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                    Фото
                  </span>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard
            title="Дефекты по задаче"
            description="Связанные записи о несоответствиях"
          >
            <ul className="space-y-4">
              {defects.map((d) =>
                d ? (
                  <li key={d.id} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-slate-900">{d.title}</span>
                      <SeverityBadge severity={d.severity} />
                      <StatusBadge variant="defect" value={d.status} />
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{d.description}</p>
                    <div className="mt-2 text-xs text-slate-500">
                      Оборудование:{" "}
                      {getEquipmentById(d.equipmentId)?.name ?? d.equipmentId}
                    </div>
                  </li>
                ) : null,
              )}
            </ul>
          </SectionCard>
        </div>
      </div>
    </AppShell>
  );
}
