import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { mockEquipment } from "@/lib/data/mock";
import { equipmentCategoryLabel, equipmentStatusLabel } from "@/lib/labels";
import type { Equipment } from "@/types";

export default function EquipmentPage() {
  const columns: Column<Equipment>[] = [
    {
      key: "name",
      header: "Оборудование",
      render: (e) => (
        <div>
          <span className="font-medium text-slate-900">{e.name}</span>
          <div className="text-xs text-slate-500">{e.location}</div>
        </div>
      ),
    },
    {
      key: "category",
      header: "Тип",
      className: "whitespace-nowrap",
      render: (e) => equipmentCategoryLabel(e.category),
    },
    {
      key: "serial",
      header: "Серийный номер",
      className: "whitespace-nowrap font-mono text-xs",
      render: (e) => e.serialNumber,
    },
    {
      key: "last",
      header: "Последний осмотр",
      className: "whitespace-nowrap tabular-nums",
      render: (e) =>
        e.lastInspectionDate
          ? new Date(e.lastInspectionDate).toLocaleDateString("ru-RU")
          : "—",
    },
    {
      key: "status",
      header: "Состояние",
      className: "whitespace-nowrap",
      render: (e) => (
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800 ring-1 ring-slate-200 ring-inset">
          {equipmentStatusLabel(e.status)}
        </span>
      ),
    },
    {
      key: "tasks",
      header: "",
      className: "w-28 text-right",
      render: () => (
        <Link
          href="/tasks"
          className="text-sm font-medium text-slate-700 hover:underline"
        >
          К задачам
        </Link>
      ),
    },
  ];

  return (
    <AppShell
      title="Оборудование"
      subtitle="Реестр объектов и краткий статус последних осмотров"
    >
      <p className="mb-4 text-sm text-slate-600">
        Список демонстрационный; в будущем здесь будет связь с паспортами и
        историей измерений.
      </p>
      <DataTable
        columns={columns}
        rows={mockEquipment}
        getRowKey={(r) => r.id}
        emptyMessage="Нет записей об оборудовании."
      />
    </AppShell>
  );
}
