import { INSPECTION_MEDIA_BUCKET } from '@/shared/lib/inspectionStorage';
import { getSupabaseClient, isSupabaseConfigured } from '@/shared/lib/supabase/client';

export type InspectionMediaRow = {
  id?: string;
  task_id: string;
  equipment_id: string;
  media_type: string;
  file_path: string;
  file_name?: string | null;
  mime_type?: string | null;
  size_bytes?: number | null;
  created_at?: string | null;
};

export type MediaWithUrl = InspectionMediaRow & {
  signedUrl: string | null;
  urlError?: string | null;
};

/**
 * Префикс времени в пути (мобильное приложение): один сеанс сохранения = один ts для всех файлов.
 * photos/.../.../{ts}_0.png  и  audio/.../.../{ts}.m4a
 */
export function extractUploadBatchMsFromPath(filePath: string): number | null {
  const m =
    filePath.match(/\/(\d{13})_\d+\.[^/]+$/) ?? filePath.match(/\/(\d{13})\.m4a$/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return Number.isNaN(n) ? null : n;
}

/**
 * Оставляет только вложения этой конкретной отправки отчёта (не предыдущие по тому же пункту задания).
 */
export function filterMediaRowsForReport(
  rows: InspectionMediaRow[],
  reportCreatedAtIso: string | null | undefined,
): InspectionMediaRow[] {
  if (rows.length === 0) return rows;
  const reportMs = reportCreatedAtIso
    ? new Date(reportCreatedAtIso).getTime()
    : NaN;
  if (Number.isNaN(reportMs)) {
    return rows;
  }

  const byBatch = new Map<number, InspectionMediaRow[]>();
  for (const r of rows) {
    const ms = extractUploadBatchMsFromPath(r.file_path);
    if (ms == null) continue;
    const list = byBatch.get(ms) ?? [];
    list.push(r);
    byBatch.set(ms, list);
  }

  const batches = [...byBatch.keys()];
  if (batches.length === 0) {
    return rows;
  }
  if (batches.length === 1) {
    return byBatch.get(batches[0]) ?? rows;
  }

  /** Пакет с временной меткой, ближайшей к моменту создания строки отчёта (ts задаётся сразу после insert отчёта). */
  const best = batches.reduce((a, b) => {
    const da = Math.abs(a - reportMs);
    const db = Math.abs(b - reportMs);
    if (db < da) return b;
    if (da < db) return a;
    return Math.max(a, b);
  });

  return byBatch.get(best) ?? rows;
}

export async function fetchInspectionMediaForReport(
  taskId: string,
  equipmentId: string,
  reportCreatedAtIso?: string | null,
): Promise<InspectionMediaRow[]> {
  if (!isSupabaseConfigured() || !taskId || !equipmentId) return [];
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('inspection_media')
    .select('*')
    .eq('task_id', taskId)
    .eq('equipment_id', equipmentId)
    .order('file_name');
  if (error) {
    console.warn('[reportMediaApi]', error.message);
    return [];
  }
  const raw = (data ?? []) as InspectionMediaRow[];
  return filterMediaRowsForReport(raw, reportCreatedAtIso);
}

/** Подписанные URL для просмотра в браузере (bucket обычно private). */
export async function attachSignedUrls(rows: InspectionMediaRow[]): Promise<MediaWithUrl[]> {
  if (!isSupabaseConfigured() || rows.length === 0) {
    return rows.map((r) => ({ ...r, signedUrl: null, urlError: null }));
  }
  const supabase = getSupabaseClient();
  const out: MediaWithUrl[] = [];
  for (const row of rows) {
    if (!row.file_path) {
      out.push({ ...row, signedUrl: null, urlError: 'Нет пути к файлу' });
      continue;
    }
    const { data, error } = await supabase.storage
      .from(INSPECTION_MEDIA_BUCKET)
      .createSignedUrl(row.file_path, 3600);
    if (error || !data?.signedUrl) {
      out.push({
        ...row,
        signedUrl: null,
        urlError: error?.message ?? 'Не удалось получить ссылку',
      });
    } else {
      out.push({ ...row, signedUrl: data.signedUrl, urlError: null });
    }
  }
  return out;
}
