"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { setDemoSessionActive } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  function handleDemoLogin() {
    setLoading(true);
    setDemoSessionActive();
    router.replace("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Промышленные осмотры
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">
              Вход для супервайзера
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Демонстрационный доступ без реальной аутентификации
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Электронная почта
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                placeholder="supervisor@example.com"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                disabled
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Пароль
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                disabled
              />
            </div>
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={loading}
              className="mt-2 w-full rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-slate-800 disabled:opacity-70"
            >
              {loading ? "Вход…" : "Войти (демо)"}
            </button>
          </div>

          <p className="mt-6 text-center text-xs text-slate-500">
            Нажмите «Войти (демо)», чтобы открыть панель с тестовыми данными.
          </p>
        </div>
      </div>
    </div>
  );
}
