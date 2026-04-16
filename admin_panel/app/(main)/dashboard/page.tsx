import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { SectionCard } from "@/components/ui/SectionCard";
import { SummaryCard } from "@/components/ui/SummaryCard";
import {
  mockActivityLogs,
  mockDashboardSummary,
  mockDefects,
  mockTasks,
} from "@/lib/data/mock";
import { taskStatusLabel } from "@/lib/labels";

export default function DashboardPage() {
  const summary = mockDashboardSummary;
  const recentTasks = [...mockTasks]
    .sort((a, b) => b.dueDate.localeCompare(a.dueDate))
    .slice(0, 5);
  const openDefects = mockDefects.filter(
    (d) => d.status === "open" || d.status === "review",
  );

  return (
    <AppShell
      title="Панель управления"
      subtitle="Сводка по задачам осмотра, дефектам и последним событиям"
    >
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <SummaryCard title="Всего задач" value={summary.totalTasks} />
          <SummaryCard title="Выполненные задачи" value={summary.completedTasks} />
          <SummaryCard title="Задачи в работе" value={summary.inProgressTasks} />
          <SummaryCard title="Проблемные задачи" value={summary.issueTasks} />
          <SummaryCard title="Открытые дефекты" value={summary.openDefects} />
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <SectionCard
            title="Обзор задач"
            description="Последние назначения и статусы выполнения"
          >
            <ul className="divide-y divide-slate-100">
              {recentTasks.map((t) => (
                <li
                  key={t.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/tasks/${t.id}`}
                      className="font-medium text-slate-900 hover:text-slate-700 hover:underline"
                    >
                      {t.title}
                    </Link>
                    <div className="text-xs text-slate-500">{t.site}</div>
                  </div>
                  <div className="text-right text-xs text-slate-600">
                    <div>{taskStatusLabel(t.status)}</div>
                    <div className="tabular-nums">
                      {t.progressPercent}%
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard
            title="Сводка по дефектам"
            description="Актуальные открытые и на проверке"
          >
            <ul className="divide-y divide-slate-100">
              {openDefects.slice(0, 5).map((d) => (
                <li key={d.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <Link
                        href="/defects"
                        className="font-medium text-slate-900 hover:underline"
                      >
                        {d.title}
                      </Link>
                      <p className="mt-1 line-clamp-2 text-xs text-slate-600">
                        {d.description}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-slate-500">
                      {new Date(d.reportedAt).toLocaleString("ru-RU")}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>

        <SectionCard
          title="Последняя активность"
          description="События из мобильного приложения и панели (демо)"
        >
          <ul className="space-y-3">
            {mockActivityLogs.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap gap-2 border-l-2 border-slate-300 pl-4 text-sm"
              >
                <span className="tabular-nums text-xs text-slate-500">
                  {new Date(a.timestamp).toLocaleString("ru-RU")}
                </span>
                <span className="text-slate-800">{a.message}</span>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>
    </AppShell>
  );
}
