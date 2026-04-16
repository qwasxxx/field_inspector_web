"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/dashboard", label: "Панель управления" },
  { href: "/tasks", label: "Задачи" },
  { href: "/equipment", label: "Оборудование" },
  { href: "/defects", label: "Дефекты" },
  { href: "/reports", label: "Отчёты" },
  { href: "/settings", label: "Настройки" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-5 py-4">
        <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Промышленный контроль
        </div>
        <div className="mt-1 text-base font-semibold text-slate-900">
          Панель супервайзера
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 p-3">
        {nav.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-slate-200 p-4 text-xs text-slate-500">
        Демо-режим · данные имитации
      </div>
    </aside>
  );
}
