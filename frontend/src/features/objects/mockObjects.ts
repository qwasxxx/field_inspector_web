/** Fallback, если в Supabase нет профилей с ролью worker. */
export const MOCK_WORKERS_FOR_ASSIGN = [
  { id: 'w-demo-1', name: 'Петров Д.О.' },
  { id: 'w-demo-2', name: 'Котов А.В.' },
  { id: 'w-demo-3', name: 'Михайлов И.С.' },
] as const;
