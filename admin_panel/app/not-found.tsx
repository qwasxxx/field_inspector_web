import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 px-4">
      <h1 className="text-2xl font-semibold text-slate-900">Страница не найдена</h1>
      <p className="mt-2 text-center text-sm text-slate-600">
        Запрошенный адрес отсутствует в демонстрационной панели.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 text-sm font-medium text-slate-900 underline"
      >
        На панель управления
      </Link>
    </div>
  );
}
