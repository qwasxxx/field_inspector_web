import { type SxProps, type Theme } from '@mui/material/styles';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import type { EquipmentNodeRow } from '@/types/topology';

export { autoTable };

/** Стиль кнопок экспорта (оранжево-коричневая обводка). */
export const exportOutlineButtonSx: SxProps<Theme> = {
  color: '#b45309',
  border: '1px solid #b45309',
  bgcolor: 'transparent',
  py: 0.75,
  px: 1.75,
  borderRadius: '6px',
  textTransform: 'none',
  '&:hover': { bgcolor: '#fffbeb', borderColor: '#b45309' },
};

export const exportIconButtonSx: SxProps<Theme> = {
  color: '#b45309',
  border: '1px solid #b45309',
  bgcolor: 'transparent',
  width: 28,
  height: 28,
  p: 0.5,
  borderRadius: '6px',
  '&:hover': { bgcolor: '#fffbeb', borderColor: '#b45309' },
};

/** Формат даты для имён файлов: YYYY-MM-DD */
export function formatDateForFilename(date = new Date()): string {
  return date.toISOString().split('T')[0];
}

/** Дата и время для документов */
export function formatDateTimeRu(date: Date): string {
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function sanitizeFilenamePart(raw: string | null | undefined): string {
  if (raw == null || String(raw).trim() === '') return 'unknown';
  return String(raw).replace(/[/\\?*[\]:]/g, '_').slice(0, 80);
}

/** Универсальный экспорт Excel */
export function exportToExcel(
  sheets: { name: string; headers: string[]; rows: (string | number)[][] }[],
  filename: string,
): void {
  const wb = XLSX.utils.book_new();
  sheets.forEach((sheet) => {
    const aoa: (string | number)[][] = [sheet.headers, ...sheet.rows];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const colWidths = sheet.headers.map((h, i) => ({
      wch: Math.max(
        h.length,
        ...sheet.rows.map((r) => String(r[i] ?? '').length),
        8,
      ) + 2,
    }));
    ws['!cols'] = colWidths;
    XLSX.utils.book_append_sheet(wb, ws, sheet.name.slice(0, 31));
  });
  XLSX.writeFile(wb, filename);
}

export const STATUS_LABELS: Record<string, string> = {
  draft: 'Черновик',
  assigned: 'Назначено',
  in_progress: 'В работе',
  completed: 'Завершено',
  completed_with_issues: 'Завершено с замечаниями',
  pending: 'Ожидает',
};

export const PRIORITY_LABELS: Record<string, string> = {
  high: 'Высокий',
  medium: 'Средний',
  low: 'Низкий',
};

export const EQUIPMENT_TYPE_LABELS: Record<string, string> = {
  transformer: 'Трансформатор',
  pump: 'Насос',
  switchboard: 'Распределительный щит',
  cable: 'Кабельная линия',
  fan: 'Вентиляционная установка',
  valve: 'Задвижка',
};

export const NODE_TYPE_LABELS: Record<string, string> = {
  plant: 'Завод',
  site: 'Площадка',
  workshop: 'Цех',
  section: 'Участок',
  equipment: 'Оборудование',
};

export const PARAM_NAMES: Record<string, string> = {
  power_kva: 'Мощность (кВА)',
  voltage_primary_kv: 'Напряжение первичное (кВ)',
  voltage_secondary_v: 'Напряжение вторичное (В)',
  manufacturer: 'Производитель',
  serial_number: 'Серийный номер',
  year_installed: 'Год установки',
  last_maintenance_at: 'Последнее ТО',
  next_maintenance_at: 'Следующее ТО',
  length_m: 'Длина (м)',
  cross_section_mm2: 'Сечение (мм²)',
  capacity_m3h: 'Производительность (м³/ч)',
  flow_m3h: 'Расход (м³/ч)',
  head_m: 'Напор (м)',
  power_kw: 'Мощность (кВт)',
  floor_area_m2: 'Площадь (м²)',
  panels_count: 'Количество панелей',
  protection_class: 'Класс защиты',
};

function paramLabel(key: string): string {
  return PARAM_NAMES[key] ?? key;
}

function formatPassportValue(value: unknown): string {
  if (value == null) return '—';
  if (typeof value === 'boolean') return value ? 'Да' : 'Нет';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') {
    const t = Date.parse(value);
    if (!Number.isNaN(t) && value.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(value)) {
      return formatDateTimeRu(new Date(value));
    }
    return value;
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function buildPassportHtml(node: EquipmentNodeRow, exportedAt: Date): HTMLElement {
  const root = document.createElement('div');
  root.style.boxSizing = 'border-box';
  root.style.width = '794px';
  root.style.padding = '76px 57px';
  root.style.fontFamily = 'Helvetica, Arial, "Segoe UI", sans-serif';
  root.style.fontSize = '11px';
  root.style.color = '#111827';
  root.style.background = '#ffffff';

  const passport = node.passport ?? {};
  const passportKeys = Object.keys(passport as object);
  const norms = node.param_norms && typeof node.param_norms === 'object' ? node.param_norms : {};
  const normKeys = Object.keys(norms);

  const eqType = node.equipment_type
    ? EQUIPMENT_TYPE_LABELS[node.equipment_type] ?? node.equipment_type
    : '—';
  const nodeType = NODE_TYPE_LABELS[node.node_type] ?? node.node_type;

  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'flex-start';
  header.style.marginBottom = '12px';

  const logo = document.createElement('div');
  logo.textContent = 'РМК Обходчик';
  logo.style.fontSize = '22px';
  logo.style.fontWeight = '700';
  logo.style.color = '#b45309';

  const docTitle = document.createElement('div');
  docTitle.textContent = 'ПАСПОРТ ОБЪЕКТА';
  docTitle.style.fontSize = '14px';
  docTitle.style.fontWeight = '700';
  docTitle.style.textTransform = 'uppercase';
  docTitle.style.textAlign = 'right';

  header.appendChild(logo);
  header.appendChild(docTitle);
  root.appendChild(header);

  const line = document.createElement('div');
  line.style.height = '1px';
  line.style.background = '#b45309';
  line.style.marginBottom = '16px';
  root.appendChild(line);

  const infoTable = document.createElement('table');
  infoTable.style.width = '100%';
  infoTable.style.borderCollapse = 'collapse';
  infoTable.style.marginBottom = '18px';

  const infoRows: [string, string][] = [
    ['Наименование', node.name ?? '—'],
    ['Код объекта', node.code ?? '—'],
    ['Тип оборудования', eqType],
    ['Уровень иерархии', nodeType],
    ['Статус', node.is_active ? 'Активен' : 'Неактивен'],
    ['Дата экспорта', formatDateTimeRu(exportedAt)],
  ];

  infoRows.forEach(([label, val], i) => {
    const tr = document.createElement('tr');
    tr.style.background = i % 2 === 0 ? '#ffffff' : '#f9fafb';
    const td1 = document.createElement('td');
    td1.textContent = label;
    td1.style.padding = '6px 8px';
    td1.style.width = '38%';
    td1.style.verticalAlign = 'top';
    const td2 = document.createElement('td');
    td2.textContent = val;
    td2.style.padding = '6px 8px';
    tr.appendChild(td1);
    tr.appendChild(td2);
    infoTable.appendChild(tr);
  });
  root.appendChild(infoTable);

  const secSpecs = document.createElement('div');
  secSpecs.textContent = 'Технические характеристики';
  secSpecs.style.fontWeight = '700';
  secSpecs.style.fontSize = '12px';
  secSpecs.style.padding = '8px 10px';
  secSpecs.style.background = '#fffbeb';
  secSpecs.style.borderRadius = '4px';
  secSpecs.style.marginBottom = '8px';
  root.appendChild(secSpecs);

  if (passportKeys.length === 0) {
    const empty = document.createElement('div');
    empty.textContent = 'Данные не заполнены';
    empty.style.color = '#6b7280';
    empty.style.marginBottom = '16px';
    root.appendChild(empty);
  } else {
    const t1 = document.createElement('table');
    t1.style.width = '100%';
    t1.style.borderCollapse = 'collapse';
    t1.style.marginBottom = '16px';
    const hr = document.createElement('tr');
    ['Параметр', 'Значение'].forEach((h) => {
      const th = document.createElement('th');
      th.textContent = h;
      th.style.textAlign = 'left';
      th.style.padding = '6px 8px';
      th.style.background = '#fffbeb';
      th.style.borderBottom = '1px solid #e5e7eb';
      hr.appendChild(th);
    });
    t1.appendChild(hr);
    passportKeys.forEach((key, i) => {
      const tr = document.createElement('tr');
      tr.style.background = i % 2 === 0 ? '#ffffff' : '#f9fafb';
      const tdA = document.createElement('td');
      tdA.textContent = paramLabel(key);
      tdA.style.padding = '6px 8px';
      const tdB = document.createElement('td');
      tdB.textContent = formatPassportValue((passport as Record<string, unknown>)[key]);
      tdB.style.padding = '6px 8px';
      tr.appendChild(tdA);
      tr.appendChild(tdB);
      t1.appendChild(tr);
    });
    root.appendChild(t1);
  }

  if (normKeys.length > 0) {
    const secNorm = document.createElement('div');
    secNorm.textContent = 'Нормативные диапазоны параметров';
    secNorm.style.fontWeight = '700';
    secNorm.style.fontSize = '12px';
    secNorm.style.padding = '8px 10px';
    secNorm.style.background = '#fffbeb';
    secNorm.style.borderRadius = '4px';
    secNorm.style.marginBottom = '8px';
    secNorm.style.marginTop = '8px';
    root.appendChild(secNorm);

    const t2 = document.createElement('table');
    t2.style.width = '100%';
    t2.style.borderCollapse = 'collapse';
    t2.style.marginBottom = '20px';
    const hr2 = document.createElement('tr');
    ['Параметр', 'Минимум', 'Максимум'].forEach((h) => {
      const th = document.createElement('th');
      th.textContent = h;
      th.style.textAlign = 'left';
      th.style.padding = '6px 8px';
      th.style.background = '#fffbeb';
      th.style.borderBottom = '1px solid #e5e7eb';
      hr2.appendChild(th);
    });
    t2.appendChild(hr2);
    normKeys.forEach((key, i) => {
      const tr = document.createElement('tr');
      tr.style.background = i % 2 === 0 ? '#ffffff' : '#f9fafb';
      const range = (norms as Record<string, { min: number; max: number }>)[key];
      const tdA = document.createElement('td');
      tdA.textContent = paramLabel(key);
      tdA.style.padding = '6px 8px';
      const tdB = document.createElement('td');
      tdB.textContent = range != null ? String(range.min) : '—';
      tdB.style.padding = '6px 8px';
      const tdC = document.createElement('td');
      tdC.textContent = range != null ? String(range.max) : '—';
      tdC.style.padding = '6px 8px';
      tr.appendChild(tdA);
      tr.appendChild(tdB);
      tr.appendChild(tdC);
      t2.appendChild(tr);
    });
    root.appendChild(t2);
  }

  const footLine = document.createElement('div');
  footLine.style.height = '1px';
  footLine.style.background = '#e5e7eb';
  footLine.style.marginTop = '8px';
  footLine.style.marginBottom = '10px';
  root.appendChild(footLine);

  const footer = document.createElement('div');
  footer.style.display = 'flex';
  footer.style.justifyContent = 'space-between';
  footer.style.fontSize = '9px';
  footer.style.color = '#6b7280';
  const fl = document.createElement('span');
  fl.textContent = 'Сформировано системой РМК Обходчик';
  const fr = document.createElement('span');
  fr.textContent = formatDateTimeRu(exportedAt);
  footer.appendChild(fl);
  footer.appendChild(fr);
  root.appendChild(footer);

  return root;
}

/** PDF паспорта оборудования (A4, кириллица через рендер в canvas). */
export async function generateEquipmentPassportPdf(node: EquipmentNodeRow): Promise<void> {
  const exportedAt = new Date();
  const el = buildPassportHtml(node, exportedAt);
  el.style.position = 'fixed';
  el.style.left = '-10000px';
  el.style.top = '0';
  el.style.zIndex = '-1';
  document.body.appendChild(el);

  try {
    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const innerW = pageW - margin * 2;
    const innerH = pageH - margin * 2;
    const imgData = canvas.toDataURL('image/png');
    const imgW = innerW;
    const imgH = (canvas.height * imgW) / canvas.width;
    let drawW = imgW;
    let drawH = imgH;
    let x = margin;
    let y = margin;
    if (imgH > innerH) {
      const scale = innerH / imgH;
      drawW = imgW * scale;
      drawH = innerH;
      x = margin + (innerW - drawW) / 2;
    }
    pdf.addImage(imgData, 'PNG', x, y, drawW, drawH);
    const code = sanitizeFilenamePart(node.code);
    const fn = `passport_${code}_${formatDateForFilename(exportedAt)}.pdf`;
    pdf.save(fn);
  } finally {
    document.body.removeChild(el);
  }
}
