"use client";

import { useRouter } from "next/navigation";
import { clearDemoSession } from "@/lib/auth";

type HeaderProps = {
  title: string;
  subtitle?: string;
};

export function Header({ title, subtitle }: HeaderProps) {
  const router = useRouter();

  function handleLogout() {
    clearDemoSession();
    router.replace("/login");
  }

  return (
    <header className="flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-50/80 px-8 py-5 backdrop-blur">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
        ) : null}
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden text-right text-sm text-slate-600 sm:block">
          <div className="font-medium text-slate-800">Елена Орлова</div>
          <div className="text-xs text-slate-500">Супервайзер смены</div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        >
          Выйти
        </button>
      </div>
    </header>
  );
}
