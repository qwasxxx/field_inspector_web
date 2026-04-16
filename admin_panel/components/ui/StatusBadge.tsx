import type { DefectStatus, SyncStatus, TaskStatus } from "@/types";
import {
  defectStatusLabel,
  syncStatusLabel,
  taskStatusLabel,
} from "@/lib/labels";

type StatusBadgeVariant = "task" | "defect" | "sync";

type StatusBadgeProps = {
  variant: StatusBadgeVariant;
  value: TaskStatus | DefectStatus | SyncStatus;
};

const taskStyles: Record<TaskStatus, string> = {
  completed: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  in_progress: "bg-sky-50 text-sky-800 ring-sky-200",
  pending: "bg-amber-50 text-amber-900 ring-amber-200",
  issue: "bg-rose-50 text-rose-800 ring-rose-200",
};

const defectStyles: Record<DefectStatus, string> = {
  open: "bg-amber-50 text-amber-900 ring-amber-200",
  review: "bg-indigo-50 text-indigo-800 ring-indigo-200",
  resolved: "bg-emerald-50 text-emerald-800 ring-emerald-200",
};

const syncStyles: Record<SyncStatus, string> = {
  synced: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  pending: "bg-amber-50 text-amber-900 ring-amber-200",
  error: "bg-rose-50 text-rose-800 ring-rose-200",
};

export function StatusBadge({ variant, value }: StatusBadgeProps) {
  let label: string;
  let className: string;

  if (variant === "task") {
    const v = value as TaskStatus;
    label = taskStatusLabel(v);
    className = taskStyles[v];
  } else if (variant === "defect") {
    const v = value as DefectStatus;
    label = defectStatusLabel(v);
    className = defectStyles[v];
  } else {
    const v = value as SyncStatus;
    label = syncStatusLabel(v);
    className = syncStyles[v];
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${className}`}
    >
      {label}
    </span>
  );
}
