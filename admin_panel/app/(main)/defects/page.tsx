import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getEquipmentById, mockDefects } from "@/lib/data/mock";
import type { DefectReport } from "@/types";

export default function DefectsPage() {
  const columns: Column<DefectReport>[] = [
    {
      key: "title",
      header: "Дефект",
      render: (d) => (
        <div>
          <span className="font-medium text-slate-900">{d.title}</span>
          <p className="mt-1 line-clamp-2 text-xs text-slate-600">
            {d.description}
          </p>
        </div>
      ),
    },
    {
      key: "severity",
      header: "Критичность",
      className: "whitespace-nowrap",
      render: (d) => <SeverityBadge severity={d.severity} />,
    },
    {
      key: "status",
      header: "Статус",
      className: "whitespace-nowrap",
      render: (d) => <StatusBadge variant="defect" value={d.status} />,
    },
    {
      key: "equipment",
      header: "Оборудование",
      render: (d) => (
        <span>{getEquipmentById(d.equipmentId)?.name ?? d.equipmentId}</span>
      ),
    },
    {
      key: "photo",
      header: "Фото",
      className: "whitespace-nowrap text-center",
      render: (d) => (d.hasPhotos ? "Да" : "Нет"),
    },
    {
      key: "date",
      header: "Зарегистрировано",
      className: "whitespace-nowrap tabular-nums",
      render: (d) =>
        new Date(d.reportedAt).toLocaleString("ru-RU", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
    },
    {
      key: "task",
      header: "",
      className: "w-28 text-right",
      render: (d) => (
        <Link
          href={`/tasks/${d.taskId}`}
          className="text-sm font-medium text-slate-700 hover:underline"
        >
          Задача
        </Link>
      ),
    },
  ];

  return (
    <AppShell
      title="Дефекты"
      subtitle="Реестр несоответствий и связь с оборудованием"
    >
      <DataTable
        columns={columns}
        rows={mockDefects}
        getRowKey={(r) => r.id}
        emptyMessage="Дефекты не найдены."
      />
    </AppShell>
  );
}
