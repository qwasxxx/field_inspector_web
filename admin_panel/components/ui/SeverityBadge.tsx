import type { DefectSeverity } from "@/types";
import { defectSeverityLabel } from "@/lib/labels";

const styles: Record<DefectSeverity, string> = {
  low: "bg-slate-100 text-slate-700 ring-slate-200",
  medium: "bg-amber-50 text-amber-900 ring-amber-200",
  high: "bg-orange-50 text-orange-900 ring-orange-200",
  critical: "bg-rose-50 text-rose-900 ring-rose-200",
};

type SeverityBadgeProps = {
  severity: DefectSeverity;
};

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${styles[severity]}`}
    >
      {defectSeverityLabel(severity)}
    </span>
  );
}
