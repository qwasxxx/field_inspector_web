"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { SearchInput } from "@/components/ui/SearchInput";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getUserById, mockTasks } from "@/lib/data/mock";
import type { InspectionTask } from "@/types";

const statusFilterOptions = [
  { value: "all", label: "Все статусы" },
  { value: "completed", label: "Выполнено" },
  { value: "in_progress", label: "В процессе" },
  { value: "pending", label: "Ожидает" },
  { value: "issue", label: "Есть проблема" },
];

export default function TasksPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("all");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return mockTasks.filter((t) => {
      const byStatus = status === "all" || t.status === status;
      if (!byStatus) return false;
      if (!q) return true;
      const assignee = getUserById(t.assigneeId)?.name ?? "";
      return (
        t.title.toLowerCase().includes(q) ||
        t.site.toLowerCase().includes(q) ||
        assignee.toLowerCase().includes(q)
      );
    });
  }, [query, status]);

  const columns: Column<InspectionTask>[] = [
    {
      key: "title",
      header: "Задача",
      render: (t) => (
        <div>
          <Link
            href={`/tasks/${t.id}`}
            className="font-medium text-slate-900 hover:underline"
          >
            {t.title}
          </Link>
          <div className="text-xs text-slate-500">{t.site}</div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Статус",
      className: "whitespace-nowrap",
      render: (t) => <StatusBadge variant="task" value={t.status} />,
    },
    {
      key: "assignee",
      header: "Исполнитель",
      render: (t) => (
        <span>{getUserById(t.assigneeId)?.name ?? "—"}</span>
      ),
    },
    {
      key: "due",
      header: "Срок",
      className: "whitespace-nowrap tabular-nums",
      render: (t) =>
        new Date(t.dueDate).toLocaleDateString("ru-RU", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }),
    },
    {
      key: "progress",
      header: "Готовность",
      className: "whitespace-nowrap tabular-nums",
      render: (t) => `${t.progressPercent}%`,
    },
    {
      key: "defects",
      header: "Дефекты",
      className: "whitespace-nowrap tabular-nums text-center",
      render: (t) => t.defectCount,
    },
    {
      key: "actions",
      header: "",
      className: "w-28 text-right",
      render: (t) => (
        <Link
          href={`/tasks/${t.id}`}
          className="text-sm font-medium text-slate-700 hover:underline"
        >
          Подробнее
        </Link>
      ),
    },
  ];

  return (
    <AppShell
      title="Задачи"
      subtitle="Список задач полевых инспекторов с фильтрацией"
    >
      <div className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <SearchInput
            label="Найти"
            value={query}
            onChange={setQuery}
            placeholder="Название, объект, исполнитель…"
          />
          <FilterSelect
            label="Фильтр по статусу"
            value={status}
            onChange={setStatus}
            options={statusFilterOptions}
          />
        </div>

        <DataTable
          columns={columns}
          rows={rows}
          getRowKey={(r) => r.id}
          emptyMessage="Нет задач по заданным условиям."
        />
      </div>
    </AppShell>
  );
}
