const LS_EXPORTED_KEY = 'rmk_1c_exported_ids';
const LS_SYNC_LOG_KEY = 'rmk_1c_sync_log';
const LS_LAST_SYNC_KEY = 'rmk_1c_last_sync';
const LS_PERMIT_COUNT_KEY = 'rmk_1c_permit_count';

export interface SyncLogEntry {
  id: string;
  timestamp: string;
  type: 'export' | 'import' | 'error';
  description: string;
  count?: number;
}

export function getExportedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(LS_EXPORTED_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

export function markAsExported(ids: string[]): void {
  const existing = getExportedIds();
  ids.forEach((id) => existing.add(id));
  localStorage.setItem(LS_EXPORTED_KEY, JSON.stringify([...existing]));
  localStorage.setItem(LS_LAST_SYNC_KEY, new Date().toISOString());
}

export function addSyncLogEntry(entry: Omit<SyncLogEntry, 'id'>): void {
  try {
    const raw = localStorage.getItem(LS_SYNC_LOG_KEY);
    const log: SyncLogEntry[] = raw ? (JSON.parse(raw) as SyncLogEntry[]) : [];
    const id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `log-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    log.unshift({ ...entry, id });
    localStorage.setItem(LS_SYNC_LOG_KEY, JSON.stringify(log.slice(0, 50)));
  } catch {
    /* ignore */
  }
}

export function getSyncLog(): SyncLogEntry[] {
  try {
    const raw = localStorage.getItem(LS_SYNC_LOG_KEY);
    return raw ? (JSON.parse(raw) as SyncLogEntry[]) : [];
  } catch {
    return [];
  }
}

export function getLastSyncTime(): string | null {
  return localStorage.getItem(LS_LAST_SYNC_KEY);
}

export function getPermitCount(): number {
  try {
    const v = localStorage.getItem(LS_PERMIT_COUNT_KEY);
    if (v == null) return 0;
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

export function incrementPermitCount(): void {
  try {
    localStorage.setItem(LS_PERMIT_COUNT_KEY, String(getPermitCount() + 1));
  } catch {
    /* ignore */
  }
}

export function formatFor1C(dateStr: string): string {
  return new Date(dateStr).toISOString().slice(0, 19);
}

export function priorityTo1C(p: string | null): string {
  const map: Record<string, string> = {
    high: 'Высокий',
    medium: 'Средний',
    low: 'Низкий',
  };
  return map[p ?? ''] ?? 'Средний';
}

export function statusTo1C(s: string): string {
  const map: Record<string, string> = {
    completed: 'Выполнено',
    completed_with_issues: 'Выполнено с замечаниями',
    in_progress: 'В работе',
    assigned: 'Назначено',
    draft: 'Черновик',
  };
  return map[s] ?? s;
}

export interface ExportRecord {
  reportId: string;
  taskTitle: string;
  equipmentId: string;
  equipmentName: string;
  defectFound: boolean;
  defectDescription: string | null;
  defectPriority: string | null;
  measurements: Record<string, unknown>;
  comment: string | null;
  photoCount: number;
  createdAt: string;
  workerName?: string;
  siteName?: string;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function generateDefectsXML(records: ExportRecord[]): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const timeStr = now.toISOString().slice(11, 19);

  const defectItems = records
    .filter((r) => r.defectFound)
    .map(
      (r) => `
    <Дефект>
      <Идентификатор>${r.reportId}</Идентификатор>
      <ОборудованиеКод>${escapeXml(String(r.equipmentId))}</ОборудованиеКод>
      <НаименованиеОборудования>${escapeXml(r.equipmentName)}</НаименованиеОборудования>
      <Площадка>${escapeXml(r.siteName ?? 'Томинская площадка')}</Площадка>
      <ДатаВыявления>${formatFor1C(r.createdAt)}</ДатаВыявления>
      <Описание>${escapeXml(r.defectDescription ?? 'Дефект выявлен при плановом осмотре')}</Описание>
      <Приоритет>${priorityTo1C(r.defectPriority)}</Приоритет>
      <Исполнитель>${escapeXml(r.workerName ?? 'Не указан')}</Исполнитель>
      <КоличествоФото>${r.photoCount}</КоличествоФото>
      <Статус>Новый</Статус>
      <Источник>РМК Обходчик</Источник>
    </Дефект>`,
    )
    .join('');

  const reportItems = records
    .map(
      (r) => `
    <ОтчётОбОбходе>
      <Идентификатор>${r.reportId}</Идентификатор>
      <ЗаданиеНазвание>${escapeXml(r.taskTitle)}</ЗаданиеНазвание>
      <ОборудованиеКод>${escapeXml(String(r.equipmentId))}</ОборудованиеКод>
      <НаименованиеОборудования>${escapeXml(r.equipmentName)}</НаименованиеОборудования>
      <ДатаОсмотра>${formatFor1C(r.createdAt)}</ДатаОсмотра>
      <ДефектВыявлен>${r.defectFound ? 'Да' : 'Нет'}</ДефектВыявлен>
      <Комментарий>${escapeXml(r.comment ?? '')}</Комментарий>
      <Измерения>${escapeXml(JSON.stringify(r.measurements))}</Измерения>
      <Источник>РМК Обходчик</Источник>
    </ОтчётОбОбходе>`,
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<!-- Файл обмена данными с 1С:ТОиР -->
<!-- Сформирован: РМК Обходчик | Дата: ${dateStr} ${timeStr} -->
<!-- Количество дефектов: ${records.filter((r) => r.defectFound).length} -->
<!-- Количество отчётов: ${records.length} -->
<ФайлОбмена
  ВерсияФормата="2.1"
  Дата="${dateStr}"
  Время="${timeStr}"
  Источник="РМК_Обходчик_v1.0"
  НазначениеСистемы="1С:ТОиР_8.3">

  <Заголовок>
    <Организация>РМК — Томинский ГОК</Организация>
    <Подразделение>Энергоцех</Подразделение>
    <КоличествоДефектов>${records.filter((r) => r.defectFound).length}</КоличествоДефектов>
    <КоличествоОтчётов>${records.length}</КоличествоОтчётов>
  </Заголовок>

  <Дефекты>${defectItems}
  </Дефекты>

  <ОтчётыОбОбходах>${reportItems}
  </ОтчётыОбОбходах>

</ФайлОбмена>`;
}

export function downloadXML(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'application/xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export interface WorkPermitData {
  permitNumber: string;
  equipmentName: string;
  equipmentCode: string;
  defectDescription: string;
  priority: string;
  siteName: string;
  issueDate: string;
  plannedDate: string;
  aiGeneratedText?: string;
}

export function generateWorkPermitXML(data: WorkPermitData): string {
  const now = new Date().toISOString().slice(0, 10);
  return `<?xml version="1.0" encoding="UTF-8"?>
<!-- Наряд-допуск | 1С:ТОиР формат -->
<НарядДопуск
  Номер="${escapeXml(data.permitNumber)}"
  Дата="${now}"
  Источник="РМК_Обходчик">

  <Оборудование>
    <Код>${escapeXml(data.equipmentCode)}</Код>
    <Наименование>${escapeXml(data.equipmentName)}</Наименование>
    <МестоУстановки>${escapeXml(data.siteName)}</МестоУстановки>
  </Оборудование>

  <РаботыПоНаряду>
    <ОписаниеДефекта>${escapeXml(data.defectDescription)}</ОписаниеДефекта>
    <ПриоритетРабот>${escapeXml(data.priority)}</ПриоритетРабот>
    <ПлановаяДатаВыполнения>${escapeXml(data.plannedDate)}</ПлановаяДатаВыполнения>
  </РаботыПоНаряду>

  <МерыБезопасности>
    <Пункт>Отключить оборудование от сети питания</Пункт>
    <Пункт>Вывесить предупредительные таблички</Пункт>
    <Пункт>Проверить отсутствие напряжения</Пункт>
    <Пункт>Заземлить оборудование</Пункт>
  </МерыБезопасности>

  ${data.aiGeneratedText ? `<ДополнительныеУказания>${escapeXml(data.aiGeneratedText)}</ДополнительныеУказания>` : ''}

  <Статус>Сформирован</Статус>
</НарядДопуск>`;
}

/** Сумма count по экспортам за последние 30 дней (из лога). */
export function countExportedLast30Days(): number {
  const since = Date.now() - 30 * 24 * 60 * 60 * 1000;
  let sum = 0;
  for (const e of getSyncLog()) {
    if (e.type !== 'export') continue;
    const t = Date.parse(e.timestamp);
    if (Number.isNaN(t) || t < since) continue;
    sum += e.count ?? 1;
  }
  return sum;
}
