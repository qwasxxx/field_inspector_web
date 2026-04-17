import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { defectPriorityRu } from '@/pages/ReportsPage/reportDisplay';
import { formatDateTime } from '@/shared/lib/formatDate';
import { getSupabaseClient, isSupabaseConfigured } from '@/shared/lib/supabase/client';
import {
  addSyncLogEntry,
  countExportedLast30Days,
  downloadXML,
  generateDefectsXML,
  generateWorkPermitXML,
  getExportedIds,
  getLastSyncTime,
  getPermitCount,
  getSyncLog,
  incrementPermitCount,
  markAsExported,
  type ExportRecord,
  type SyncLogEntry,
} from '@/utils/integration1cUtils';

type EnrichedDefectRow = {
  id: string;
  task_id: string;
  equipment_id: string;
  defect_found: boolean | null;
  defect_description: string | null;
  defect_priority: string | null;
  measurements: unknown;
  comment_text: string | null;
  photo_count: number | null;
  created_at: string | null;
  task_title: string | null;
  site_name: string | null;
  equipment_name: string | null;
  equipment_code: string | null;
};

function rowToExportRecord(r: EnrichedDefectRow): ExportRecord {
  const code = r.equipment_code ?? r.equipment_id;
  const name = r.equipment_name ?? code ?? '—';
  return {
    reportId: r.id,
    taskTitle: r.task_title ?? 'Обход',
    equipmentId: String(code),
    equipmentName: name,
    defectFound: Boolean(r.defect_found),
    defectDescription: r.defect_description,
    defectPriority: r.defect_priority,
    measurements:
      r.measurements && typeof r.measurements === 'object' && r.measurements !== null
        ? (r.measurements as Record<string, unknown>)
        : {},
    comment: r.comment_text,
    photoCount: r.photo_count ?? 0,
    createdAt: r.created_at ?? new Date().toISOString(),
    siteName: r.site_name ?? 'Томинская площадка',
  };
}

export function Integration1CPage() {
  const [activeTab, setActiveTab] = useState<'queue' | 'log'>('queue');
  const [defectReports, setDefectReports] = useState<EnrichedDefectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [syncLog, setSyncLog] = useState<SyncLogEntry[]>([]);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [permitCount, setPermitCount] = useState(0);

  const [showPermitModal, setShowPermitModal] = useState(false);
  const [permitDefect, setPermitDefect] = useState<EnrichedDefectRow | null>(null);
  const [aiPermitText, setAiPermitText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [permitPlannedDate, setPermitPlannedDate] = useState('');
  const [permitPriority, setPermitPriority] = useState('Средний');

  const refreshLocalState = useCallback(() => {
    setSyncLog(getSyncLog());
    setLastSync(getLastSyncTime());
    setPermitCount(getPermitCount());
  }, []);

  const loadData = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setDefectReports([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const supabase = getSupabaseClient();
      const { data: reports, error } = await supabase
        .from('inspection_reports')
        .select(
          'id, task_id, equipment_id, defect_found, defect_description, defect_priority, measurements, comment_text, photo_count, created_at',
        )
        .eq('defect_found', true)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        setLoadError(error.message);
        setDefectReports([]);
        return;
      }

      const rows: EnrichedDefectRow[] = [];
      for (const raw of reports ?? []) {
        const r = raw as EnrichedDefectRow;
        let taskTitle: string | null = null;
        let siteName: string | null = null;
        let equipmentName: string | null = null;
        let equipmentCode: string | null = null;
        if (r.task_id) {
          const { data: t } = await supabase
            .from('inspection_tasks')
            .select('title, site_name')
            .eq('id', r.task_id)
            .maybeSingle();
          const tr = t as { title?: string; site_name?: string } | null;
          taskTitle = tr?.title ?? null;
          siteName = tr?.site_name ?? null;
        }
        if (r.equipment_id) {
          const { data: it } = await supabase
            .from('inspection_task_items')
            .select('equipment_name, equipment_code')
            .eq('id', r.equipment_id)
            .maybeSingle();
          const ir = it as { equipment_name?: string; equipment_code?: string } | null;
          equipmentName = ir?.equipment_name ?? null;
          equipmentCode = ir?.equipment_code ?? null;
        }
        rows.push({
          ...r,
          task_title: taskTitle,
          site_name: siteName,
          equipment_name: equipmentName,
          equipment_code: equipmentCode,
        });
      }
      setDefectReports(rows);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : String(e));
      setDefectReports([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
    refreshLocalState();
  }, [loadData, refreshLocalState]);

  const exportedIds = useMemo(() => getExportedIds(), [defectReports, syncLog, lastSync]);

  const pendingRows = useMemo(
    () => defectReports.filter((r) => !exportedIds.has(r.id)),
    [defectReports, exportedIds],
  );

  const pendingCount = pendingRows.length;

  const exported30d = useMemo(() => countExportedLast30Days(), [syncLog]);

  const lastSyncFormatted = lastSync ? formatDateTime(lastSync) : '—';

  const allPendingSelected =
    pendingRows.length > 0 && pendingRows.every((r) => selectedIds.has(r.id));

  const toggleSelectAllPending = () => {
    if (pendingRows.length === 0) return;
    if (allPendingSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingRows.map((r) => r.id)));
    }
  };

  const toggleRow = (id: string, pending: boolean) => {
    if (!pending) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSync = async () => {
    setSyncing(true);
    setSuccessMessage(null);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const exp = getExportedIds();
    const pendingIds = defectReports.filter((r) => !exp.has(r.id)).map((r) => r.id);

    if (pendingIds.length > 0) {
      markAsExported(pendingIds);
      addSyncLogEntry({
        timestamp: new Date().toISOString(),
        type: 'export',
        description: 'Передано дефектов и отчётов в 1С:ТОиР',
        count: pendingIds.length,
      });
      addSyncLogEntry({
        timestamp: new Date().toISOString(),
        type: 'import',
        description: 'Получены плановые задания на ТО из 1С:ТОиР',
        count: 3,
      });
      setSuccessMessage(`Синхронизация завершена: передано ${pendingIds.length} записей`);
    } else {
      addSyncLogEntry({
        timestamp: new Date().toISOString(),
        type: 'export',
        description: 'Синхронизация выполнена — новых записей нет',
        count: 0,
      });
      setSuccessMessage('Синхронизация завершена — все данные актуальны');
    }

    setSyncing(false);
    setLastSync(new Date().toISOString());
    refreshLocalState();
    void loadData();
  };

  const handleTransferSelected = () => {
    if (selectedIds.size === 0) return;
    markAsExported([...selectedIds]);
    addSyncLogEntry({
      timestamp: new Date().toISOString(),
      type: 'export',
      description: 'Передано выбранных записей в 1С:ТОиР',
      count: selectedIds.size,
    });
    setSelectedIds(new Set());
    refreshLocalState();
    void loadData();
  };

  const handleDownloadXmlSelected = () => {
    if (selectedIds.size === 0) return;
    const toExport = defectReports.filter((r) => selectedIds.has(r.id));
    const records: ExportRecord[] = toExport.map((r) => rowToExportRecord(r));
    const xml = generateDefectsXML(records);
    const date = new Date().toISOString().slice(0, 10);
    downloadXML(xml, `rmk_1c_export_${date}.xml`);
    markAsExported([...selectedIds]);
    addSyncLogEntry({
      timestamp: new Date().toISOString(),
      type: 'export',
      description: 'Выгружено в 1С:ТОиР (ручной экспорт XML)',
      count: selectedIds.size,
    });
    setSelectedIds(new Set());
    refreshLocalState();
    void loadData();
  };

  const handleTransferOne = (id: string) => {
    markAsExported([id]);
    addSyncLogEntry({
      timestamp: new Date().toISOString(),
      type: 'export',
      description: 'Запись передана в 1С:ТОиР',
      count: 1,
    });
    refreshLocalState();
    void loadData();
  };

  const openPermit = (row: EnrichedDefectRow) => {
    setPermitDefect(row);
    setAiPermitText('');
    setPermitPriority(defectPriorityRu(row.defect_priority as string | null));
    const d = new Date();
    d.setDate(d.getDate() + 3);
    setPermitPlannedDate(d.toISOString().slice(0, 10));
    setShowPermitModal(true);
  };

  const generateWorkPermitAi = async () => {
    if (!permitDefect) return;
    setAiLoading(true);
    setAiPermitText('');
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined;
    if (!apiKey?.trim()) {
      setAiPermitText('Задайте VITE_ANTHROPIC_API_KEY в frontend/.env.local для генерации текста.');
      setAiLoading(false);
      return;
    }
    try {
      const equipmentName = permitDefect.equipment_name ?? permitDefect.equipment_id;
      const equipmentCode = permitDefect.equipment_code ?? '—';
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey.trim(),
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [
            {
              role: 'user',
              content: `Ты — инженер по технике безопасности на горно-металлургическом предприятии РМК.
Составь краткие дополнительные указания для наряда-допуска на ремонт оборудования.

Оборудование: ${equipmentName} (${equipmentCode})
Дефект: ${permitDefect.defect_description ?? '—'}
Приоритет: ${permitPriority}
Площадка: Томинский ГОК, Энергоцех №3

Составь:
1. Перечень необходимых инструментов и запчастей (3-5 пунктов)
2. Особые меры безопасности для данного типа оборудования (3-4 пункта)
3. Ожидаемое время выполнения работ

Ответ на русском языке, кратко и по делу. Без лишних вступлений.`,
            },
          ],
        }),
      });
      const data = (await response.json()) as {
        content?: Array<{ type?: string; text?: string }>;
        error?: { message?: string };
      };
      const text =
        data.content?.find((c) => c.type === 'text')?.text ??
        (typeof data.error?.message === 'string' ? data.error.message : null) ??
        'Не удалось сгенерировать текст';
      setAiPermitText(text);
    } catch {
      setAiPermitText('Ошибка генерации. Заполните вручную или проверьте сеть и ключ API.');
    } finally {
      setAiLoading(false);
    }
  };

  const downloadPermitXml = () => {
    if (!permitDefect) return;
    const permitNumber = `НД-${Date.now().toString(36).toUpperCase()}`;
    const xml = generateWorkPermitXML({
      permitNumber,
      equipmentName: permitDefect.equipment_name ?? permitDefect.equipment_id,
      equipmentCode: permitDefect.equipment_code ?? '—',
      defectDescription: permitDefect.defect_description ?? '',
      priority: permitPriority,
      siteName: permitDefect.site_name ?? 'Томинский ГОК, Энергоцех',
      issueDate: new Date().toISOString().slice(0, 10),
      plannedDate: permitPlannedDate,
      aiGeneratedText: aiPermitText || undefined,
    });
    downloadXML(xml, `narjad_dopusk_${permitNumber.replace(/[/\\?*[\]:]/g, '_')}.xml`);
    incrementPermitCount();
    addSyncLogEntry({
      timestamp: new Date().toISOString(),
      type: 'export',
      description: `Сформирован наряд-допуск ${permitNumber}`,
      count: 1,
    });
    refreshLocalState();
  };

  const printPermit = () => {
    window.print();
  };

  const primaryBtnSx = {
    background: '#b45309',
    color: '#fff',
    borderRadius: '8px',
    py: 1,
    px: 2,
    textTransform: 'none' as const,
    '&:hover': { background: '#92400e' },
    '&:disabled': { opacity: 0.6 },
  };

  const outlineBtnSx = {
    border: '1px solid #b45309',
    color: '#b45309',
    background: 'transparent',
    borderRadius: '8px',
    py: 1,
    px: 2,
    textTransform: 'none' as const,
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 1200 }}>
      <Typography variant="h4" sx={{ fontSize: 24, fontWeight: 700, mb: 2 }}>
        Интеграция с 1С
      </Typography>

      <style>
        {`
          @keyframes pulse1c {
            0% { transform: scale(1); opacity: 0.4; }
            50% { transform: scale(2.5); opacity: 0; }
            100% { transform: scale(1); opacity: 0; }
          }
        `}
      </style>

      <Paper
        elevation={0}
        sx={{
          background: '#f0fdf4',
          border: '1px solid #86efac',
          borderRadius: '10px',
          p: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
          mb: 2.5,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box sx={{ position: 'relative', width: 10, height: 10 }}>
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: '#16a34a',
                position: 'absolute',
              }}
            />
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: '#16a34a',
                position: 'absolute',
                animation: 'pulse1c 2s infinite',
                opacity: 0.4,
              }}
            />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#166534' }}>
              Подключено к 1С:ТОиР 8.3
            </Typography>
            <Typography sx={{ fontSize: 12, color: '#4ade80' }}>
              Сервер: toir.rmk-group.ru:8080 · Последняя синхронизация: {lastSyncFormatted}
            </Typography>
          </Box>
        </Stack>
        <Button
          variant="contained"
          onClick={() => void handleSync()}
          disabled={syncing}
          sx={primaryBtnSx}
        >
          {syncing ? 'Синхронизация...' : '⟳ Синхронизировать'}
        </Button>
      </Paper>

      {successMessage ? (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      ) : null}

      {!isSupabaseConfigured() ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Задайте VITE_SUPABASE_URL и ключ в .env — иначе очередь не загрузится.
        </Alert>
      ) : null}
      {loadError ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {loadError}
        </Alert>
      ) : null}

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }} flexWrap="wrap">
        {[
          { label: 'Ожидают передачи', value: pendingCount },
          { label: 'Передано за 30 дней', value: exported30d },
          { label: 'Ошибок передачи', value: 0 },
          { label: 'Наряд-допусков создано', value: permitCount },
        ].map((k) => (
          <Paper
            key={k.label}
            elevation={0}
            sx={{
              flex: '1 1 180px',
              border: '0.5px solid #e5e7eb',
              borderRadius: '12px',
              p: 2,
              bgcolor: '#fff',
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 12 }}>
              {k.label}
            </Typography>
            <Typography sx={{ fontSize: 22, fontWeight: 700, mt: 0.5 }}>{k.value}</Typography>
          </Paper>
        ))}
      </Stack>

      <Paper
        elevation={0}
        sx={{
          border: '0.5px solid #e5e7eb',
          borderRadius: '12px',
          p: 2.5,
          bgcolor: '#fff',
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Очередь передачи" value="queue" />
          <Tab label="История синхронизаций" value="log" />
        </Tabs>

        {activeTab === 'queue' ? (
          <>
            <Stack direction="row" alignItems="center" spacing={2} flexWrap="wrap" sx={{ mb: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={allPendingSelected}
                    indeterminate={selectedIds.size > 0 && !allPendingSelected}
                    onChange={toggleSelectAllPending}
                    disabled={pendingRows.length === 0}
                  />
                }
                label={
                  <Typography variant="body2" color="text.secondary">
                    Выбрать все ожидающие
                  </Typography>
                }
              />
              <Button
                variant="contained"
                sx={primaryBtnSx}
                disabled={selectedIds.size === 0}
                onClick={handleTransferSelected}
              >
                Передать выбранные в 1С
              </Button>
              <Button
                variant="outlined"
                sx={outlineBtnSx}
                disabled={selectedIds.size === 0}
                onClick={handleDownloadXmlSelected}
              >
                ⬇ Скачать XML
              </Button>
            </Stack>

            {loading ? (
              <CircularProgress size={28} />
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox" />
                      <TableCell>Дата</TableCell>
                      <TableCell>Оборудование</TableCell>
                      <TableCell>Дефект</TableCell>
                      <TableCell>Приоритет</TableCell>
                      <TableCell>Статус</TableCell>
                      <TableCell align="right">Действия</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {defectReports.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7}>
                          <Typography variant="body2" color="text.secondary">
                            Нет записей с дефектами или данные недоступны.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      defectReports.map((r) => {
                        const pending = !exportedIds.has(r.id);
                        const eq =
                          [r.equipment_name, r.equipment_code].filter(Boolean).join(' · ') ||
                          r.equipment_id;
                        return (
                          <TableRow key={r.id} sx={{ borderBottom: '0.5px solid #f3f4f6' }}>
                            <TableCell padding="checkbox">
                              <Checkbox
                                checked={selectedIds.has(r.id)}
                                disabled={!pending}
                                onChange={() => toggleRow(r.id, pending)}
                              />
                            </TableCell>
                            <TableCell sx={{ fontSize: 13 }}>
                              {formatDateTime(r.created_at ?? undefined)}
                            </TableCell>
                            <TableCell sx={{ fontSize: 13 }}>{eq}</TableCell>
                            <TableCell
                              sx={{ fontSize: 13, maxWidth: 220, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                              title={String(r.defect_description ?? '')}
                            >
                              {r.defect_description ? String(r.defect_description).slice(0, 80) : '—'}
                            </TableCell>
                            <TableCell sx={{ fontSize: 13 }}>
                              {defectPriorityRu(r.defect_priority as string | null)}
                            </TableCell>
                            <TableCell>
                              {pending ? (
                                <Chip size="small" label="Ожидает передачи" sx={{ bgcolor: '#ffedd5', color: '#9a3412' }} />
                              ) : (
                                <Chip size="small" label="Передано в 1С" sx={{ bgcolor: '#dcfce7', color: '#166534' }} />
                              )}
                            </TableCell>
                            <TableCell align="right">
                              <Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap">
                                {pending ? (
                                  <Button size="small" sx={outlineBtnSx} onClick={() => handleTransferOne(r.id)}>
                                    Передать
                                  </Button>
                                ) : null}
                                <Button size="small" sx={outlineBtnSx} onClick={() => openPermit(r)}>
                                  Наряд-допуск
                                </Button>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Время</TableCell>
                  <TableCell>Тип</TableCell>
                  <TableCell>Описание</TableCell>
                  <TableCell align="right">Кол-во записей</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {syncLog.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <Typography variant="body2" color="text.secondary">
                        История пуста.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  syncLog.map((e) => (
                    <TableRow key={e.id} sx={{ borderBottom: '0.5px solid #f3f4f6' }}>
                      <TableCell sx={{ fontSize: 13 }}>{formatDateTime(e.timestamp)}</TableCell>
                      <TableCell>
                        {e.type === 'export' ? (
                          <Chip size="small" label="Экспорт" sx={{ bgcolor: '#dbeafe', color: '#1e40af' }} />
                        ) : e.type === 'import' ? (
                          <Chip size="small" label="Импорт" sx={{ bgcolor: '#f3e8ff', color: '#6b21a8' }} />
                        ) : (
                          <Chip size="small" label="Ошибка" sx={{ bgcolor: '#fee2e2', color: '#991b1b' }} />
                        )}
                      </TableCell>
                      <TableCell sx={{ fontSize: 13 }}>{e.description}</TableCell>
                      <TableCell align="right" sx={{ fontSize: 13 }}>
                        {e.count ?? '—'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog
        open={showPermitModal}
        onClose={() => setShowPermitModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Наряд-допуск</DialogTitle>
        <DialogContent dividers>
          {permitDefect ? (
            <Stack spacing={2}>
              <Typography variant="body2" color="text.secondary">
                Оборудование: {permitDefect.equipment_name ?? '—'} ({permitDefect.equipment_code ?? '—'})
              </Typography>
              <Typography variant="body2">
                Дефект: {permitDefect.defect_description ?? '—'}
              </Typography>
              <FormControl fullWidth size="small">
                <InputLabel>Приоритет</InputLabel>
                <Select
                  value={permitPriority}
                  label="Приоритет"
                  onChange={(e) => setPermitPriority(e.target.value)}
                >
                  <MenuItem value="Низкий">Низкий</MenuItem>
                  <MenuItem value="Средний">Средний</MenuItem>
                  <MenuItem value="Высокий">Высокий</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Плановая дата выполнения"
                type="date"
                value={permitPlannedDate}
                onChange={(e) => setPermitPlannedDate(e.target.value)}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
              />
              <Button
                variant="contained"
                sx={primaryBtnSx}
                onClick={() => void generateWorkPermitAi()}
                disabled={aiLoading}
              >
                {aiLoading ? 'Генерация…' : 'Сгенерировать с AI'}
              </Button>
              {aiPermitText ? (
                <TextField
                  label="Дополнительные указания (AI)"
                  value={aiPermitText}
                  onChange={(e) => setAiPermitText(e.target.value)}
                  multiline
                  minRows={4}
                  fullWidth
                />
              ) : null}
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPermitModal(false)}>Закрыть</Button>
          <Button sx={outlineBtnSx} onClick={printPermit}>
            Скачать PDF (печать)
          </Button>
          <Button sx={primaryBtnSx} onClick={downloadPermitXml} disabled={!permitDefect}>
            Скачать XML
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
