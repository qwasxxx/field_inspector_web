/** Значение по умолчанию — как в supabase/migrations для task-chat. Переопределение: VITE_TASK_CHAT_MEDIA_BUCKET */
const DEFAULT_TASK_CHAT_BUCKET = 'task-chat-media';

export function getTaskChatMediaBucket(): string {
  return import.meta.env.VITE_TASK_CHAT_MEDIA_BUCKET?.trim() || DEFAULT_TASK_CHAT_BUCKET;
}

/** Bucket из строки вложения (если мобильное заполняет storage_bucket). Иначе — из env. */
export function getAttachmentBucket(att: Record<string, unknown>): string {
  const v = att.storage_bucket ?? att.bucket_id ?? att.bucket;
  if (v != null && String(v).trim() !== '') return String(v).trim();
  return getTaskChatMediaBucket();
}

/** Ключ для карты signed URL: bucket + нормализованный или сырой путь. */
export function attachmentSignedUrlMapKey(bucket: string, pathForKey: string): string {
  return `${bucket}::${pathForKey}`;
}

/** @deprecated используйте getTaskChatMediaBucket() */
export const TASK_CHAT_MEDIA_BUCKET = DEFAULT_TASK_CHAT_BUCKET;

/**
 * Путь объекта в Storage из строки вложения (как в мобильном / БД).
 */
export function getAttachmentStoragePath(att: Record<string, unknown>): string {
  const keys = ['storage_path', 'file_path', 'path', 'object_path', 'storage_object_path'] as const;
  for (const k of keys) {
    const v = att[k];
    if (v != null && String(v).trim() !== '') return String(v).trim();
  }
  return '';
}

/**
 * Приводит путь к виду, который ожидает Storage API: без префикса bucket и без ведущих слэшей.
 * Поддерживает полные публичные URL Supabase (если мобильное сохранило URL).
 */
export function normalizeStoragePathForBucket(raw: string, bucket: string): string {
  let p = raw.trim();
  if (!p) return '';
  try {
    if (p.startsWith('http://') || p.startsWith('https://')) {
      const u = new URL(p);
      const pathname = decodeURIComponent(u.pathname);
      const markers = [
        `/storage/v1/object/public/${bucket}/`,
        `/object/public/${bucket}/`,
        `/storage/v1/object/sign/${bucket}/`,
        `/object/sign/${bucket}/`,
      ];
      for (const marker of markers) {
        const idx = pathname.indexOf(marker);
        if (idx >= 0) {
          p = pathname.slice(idx + marker.length);
          break;
        }
      }
    }
  } catch {
    /* оставляем p */
  }
  if (p.startsWith(`${bucket}/`)) p = p.slice(bucket.length + 1);
  return p.replace(/^\/+/, '');
}

export type ChatAttachmentVisualKind = 'image' | 'video' | 'pdf' | 'file';

export function inferAttachmentKind(
  mime: string | null | undefined,
  fileName: string | null | undefined,
): ChatAttachmentVisualKind {
  const m = (mime ?? '').toLowerCase();
  if (m.startsWith('image/')) return 'image';
  if (m.startsWith('video/')) return 'video';
  if (m === 'application/pdf' || m.includes('pdf')) return 'pdf';
  const name = (fileName ?? '').toLowerCase();
  if (/\.(jpg|jpeg|png|gif|webp|bmp|heic|svg)$/i.test(name)) return 'image';
  if (/\.(mp4|webm|mov|m4v|mkv)$/i.test(name)) return 'video';
  if (/\.pdf$/i.test(name)) return 'pdf';
  return 'file';
}
