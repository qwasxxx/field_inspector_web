/**
 * Колонка текста в task_chat_messages = как в общей БД с мобильным приложением.
 * По умолчанию: `body` (текущая схема с мобильным клиентом).
 * Иначе: VITE_TASK_CHAT_MESSAGE_COLUMN в frontend/.env.local
 */
const FALLBACK_READ_KEYS = ['body', 'body_text', 'content', 'message_text', 'text', 'message'] as const;

export function taskChatMessageTextColumn(): string {
  const fromEnv = import.meta.env.VITE_TASK_CHAT_MESSAGE_COLUMN?.trim();
  if (fromEnv) return fromEnv;
  return 'body';
}

/** Plain text of a chat message row for UI (works across legacy column names). */
export function getTaskChatMessageText(row: Record<string, unknown> | null | undefined): string {
  if (!row) return '';
  const preferred = taskChatMessageTextColumn();
  const primary = row[preferred];
  if (primary != null && String(primary).trim() !== '') return String(primary);
  for (const k of FALLBACK_READ_KEYS) {
    if (k === preferred) continue;
    const v = row[k];
    if (v != null && String(v).trim() !== '') return String(v);
  }
  return '';
}
