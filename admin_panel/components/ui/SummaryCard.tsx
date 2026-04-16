import type { ReactNode } from "react";

type SummaryCardProps = {
  title: string;
  value: string | number;
  hint?: string;
  icon?: ReactNode;
};

export function SummaryCard({ title, value, hint, icon }: SummaryCardProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="text-sm font-medium text-slate-600">{title}</div>
        {icon ? (
          <div className="text-slate-400 [&>svg]:h-5 [&>svg]:w-5">{icon}</div>
        ) : null}
      </div>
      <div className="mt-3 text-3xl font-semibold tabular-nums text-slate-900">
        {value}
      </div>
      {hint ? (
        <p className="mt-2 text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}
