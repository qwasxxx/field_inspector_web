/** Короткая подпись «сколько времени назад» для ISO-даты. */
export function formatRelativeRu(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '—';
  const diffMs = Date.now() - t;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'только что';
  if (minutes < 60) return `${minutes} мин назад`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ч назад`;
  const days = Math.floor(hours / 24);
  if (days < 14) return `${days} дн. назад`;
  const weeks = Math.floor(days / 7);
  return `${weeks} нед. назад`;
}
