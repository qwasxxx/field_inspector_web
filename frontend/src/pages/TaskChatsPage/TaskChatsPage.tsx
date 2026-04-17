import AttachFileRoundedIcon from '@mui/icons-material/AttachFileRounded';
import InsertDriveFileRoundedIcon from '@mui/icons-material/InsertDriveFileRounded';
import PictureAsPdfRoundedIcon from '@mui/icons-material/PictureAsPdfRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import VideoFileRoundedIcon from '@mui/icons-material/VideoFileRounded';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment,
  Link,
  Tooltip,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import type { TaskChatAttachmentRow } from '@/entities/factory/model/types';
import type { TaskChatMessageWithMeta, TaskChatRealtimeStatus, TaskChatThreadSummary } from '@/features/factory/services/taskChatApi';
import {
  compareTaskChatThreadRows,
  ensureThreadForTask,
  fetchTaskChatMessages,
  fetchTaskChatThreadSummaries,
  getCurrentUserId,
  markTaskChatThreadRead,
  sendTaskChatMessage,
  subscribeAdminTaskChat,
} from '@/features/factory/services/taskChatApi';
import { formatDateTime } from '@/shared/lib/formatDate';
import { getTaskChatMessageText } from '@/shared/lib/taskChatMessageText';
import { describeSupabaseConfigGap, isSupabaseConfigured } from '@/shared/lib/supabase/client';
import {
  attachmentSignedUrlMapKey,
  getAttachmentBucket,
  getAttachmentStoragePath,
  inferAttachmentKind,
  normalizeStoragePathForBucket,
} from '@/shared/lib/taskChatStorage';

function roleLabel(role: string | null | undefined): string {
  if (role === 'admin') return 'Админ';
  if (role === 'worker') return 'Обходчик';
  if (role === 'system') return 'Система';
  return role ?? '—';
}

function resolveChatAttachmentSignedUrl(
  att: TaskChatAttachmentRow,
  signedUrls: Record<string, string | null>,
): string | null {
  const bucket = getAttachmentBucket(att as Record<string, unknown>);
  const raw = getAttachmentStoragePath(att as Record<string, unknown>);
  if (!raw) return null;
  const norm = normalizeStoragePathForBucket(raw, bucket);
  return (
    signedUrls[attachmentSignedUrlMapKey(bucket, raw)] ??
    (norm ? signedUrls[attachmentSignedUrlMapKey(bucket, norm)] : undefined) ??
    null
  );
}

export function TaskChatsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const preselectTaskId = searchParams.get('task');

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [summaries, setSummaries] = useState<TaskChatThreadSummary[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [filter, setFilter] = useState('');
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);

  const [messages, setMessages] = useState<TaskChatMessageWithMeta[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);

  const [draft, setDraft] = useState('');
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const [uploadWarning, setUploadWarning] = useState<string | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<TaskChatRealtimeStatus | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const listScrollRef = useRef<HTMLDivElement | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedThreadIdRef = useRef<string | null>(null);
  selectedThreadIdRef.current = selectedThreadId;

  const configured = isSupabaseConfigured();

  const loadSummaries = useCallback(async () => {
    if (!configured) {
      setListLoading(false);
      return;
    }
    setListError(null);
    const { data, error } = await fetchTaskChatThreadSummaries();
    if (error) {
      setListError(error);
      setSummaries([]);
    } else {
      setSummaries(data);
    }
    setListLoading(false);
  }, [configured]);

  const loadMessages = useCallback(async (threadId: string) => {
    setMessagesError(null);
    setMessagesLoading(true);
    const { data, error } = await fetchTaskChatMessages(threadId);
    if (error) {
      console.error('[TaskChatsPage] loadMessages failed', { threadId, error });
      setMessagesError(error);
      setMessages([]);
    } else {
      setMessages(data);
    }
    setMessagesLoading(false);
  }, []);

  const scheduleRefresh = useCallback(() => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = setTimeout(() => {
      void loadSummaries();
      const sid = selectedThreadIdRef.current;
      if (sid) void loadMessages(sid);
      refreshTimerRef.current = null;
    }, 280);
  }, [loadSummaries, loadMessages]);

  useEffect(() => {
    if (!configured) {
      setCurrentUserId(null);
      return;
    }
    void getCurrentUserId().then(setCurrentUserId);
  }, [configured]);

  useEffect(() => {
    if (!configured) {
      setListLoading(false);
      return;
    }
    void loadSummaries();
  }, [configured, loadSummaries]);

  useEffect(() => {
    if (!configured) return;
    const unsub = subscribeAdminTaskChat({
      onChange: () => scheduleRefresh(),
      onStatus: (s) => setRealtimeStatus(s),
    });
    return () => {
      unsub();
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, [configured, scheduleRefresh]);

  useEffect(() => {
    if (!selectedThreadId) {
      setMessages([]);
      return;
    }
    void loadMessages(selectedThreadId);
    void markTaskChatThreadRead(selectedThreadId).then(({ error }) => {
      if (error) console.warn('[TaskChatsPage] read marker', error);
      void loadSummaries();
    });
  }, [selectedThreadId, loadMessages, loadSummaries]);

  /** Deep-link: /chats?task=… — создать поток при отсутствии и выбрать. */
  useEffect(() => {
    if (!configured || !preselectTaskId?.trim() || listLoading) return;

    let cancelled = false;
    void (async () => {
      const { data, error } = await ensureThreadForTask(preselectTaskId.trim());
      if (cancelled) return;
      if (error) {
        setListError((e) => (e ? `${e}; ${error}` : error));
        return;
      }
      if (data.threadId) {
        setSelectedThreadId(data.threadId);
        setSearchParams({}, { replace: true });
        void loadSummaries();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [configured, preselectTaskId, listLoading, setSearchParams, loadSummaries]);

  const filteredSummaries = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const sorted = [...summaries].sort((a, b) => compareTaskChatThreadRows(a.thread, b.thread));
    if (!q) return sorted;
    return sorted.filter((s) => {
      const title = (s.task?.title ?? '').toLowerCase();
      const wname = (s.worker?.full_name ?? s.worker?.username ?? '').toLowerCase();
      const prev = (s.latestMessagePreview ?? '').toLowerCase();
      return title.includes(q) || wname.includes(q) || prev.includes(q);
    });
  }, [summaries, filter]);

  const selectedSummary = useMemo(
    () => summaries.find((s) => String(s.thread.id) === selectedThreadId) ?? null,
    [summaries, selectedThreadId],
  );

  const selectedTaskId = selectedSummary?.thread.task_id ? String(selectedSummary.thread.task_id) : null;

  const onPickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? [...e.target.files] : [];
    setPendingFiles((prev) => [...prev, ...files]);
    e.target.value = '';
  };

  const onSend = async () => {
    if (!selectedThreadId) return;
    if (!draft.trim() && pendingFiles.length === 0) return;
    setSendError(null);
    setUploadWarning(null);
    setSending(true);
    const textSnapshot = draft;
    const filesSnapshot = [...pendingFiles];
    const { error, data } = await sendTaskChatMessage({
      threadId: selectedThreadId,
      taskId: selectedTaskId ?? undefined,
      text: textSnapshot,
      files: filesSnapshot,
    });
    setSending(false);
    if (error && !data.messageId) {
      setSendError(error);
      return;
    }
    if (error && data.messageId) {
      setUploadWarning(error);
    }
    setDraft('');
    setPendingFiles([]);
    await loadMessages(selectedThreadId);
    await loadSummaries();
    void markTaskChatThreadRead(selectedThreadId);
  };

  const realtimeAlert =
    realtimeStatus && realtimeStatus !== 'SUBSCRIBED' ? (
      <Alert severity="warning" sx={{ mb: 2 }}>
        Обновления в реальном времени: соединение «{realtimeStatus}». Сообщения могут появляться с задержкой —
        обновите страницу при необходимости.
      </Alert>
    ) : null;

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Чаты
      </Typography>
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Переписка привязана к заданию: один чат на задачу. Данные из Supabase (те же таблицы, что у мобильного
          приложения). Завершённые и архивные задания не скрывают чат, если поток есть в базе.
        </Typography>
        {configured ? (
          <Tooltip title="Обновить список и сообщения">
            <IconButton
              aria-label="Обновить"
              onClick={() => {
                void loadSummaries();
                if (selectedThreadId) void loadMessages(selectedThreadId);
              }}
              disabled={listLoading}
            >
              <RefreshRoundedIcon />
            </IconButton>
          </Tooltip>
        ) : null}
      </Stack>

      {!configured ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {describeSupabaseConfigGap()}
        </Alert>
      ) : null}
      {listError ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {listError}
          {import.meta.env.DEV ? (
            <Typography variant="caption" component="div" sx={{ display: 'block', mt: 1, opacity: 0.85 }}>
              Режим разработки: проверьте RLS, сессию Supabase Auth и имена колонок (VITE_TASK_CHAT_MESSAGE_COLUMN).
            </Typography>
          ) : null}
        </Alert>
      ) : null}
      {sendError ? (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSendError(null)}>
          {sendError}
        </Alert>
      ) : null}
      {uploadWarning ? (
        <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setUploadWarning(null)}>
          {uploadWarning}
        </Alert>
      ) : null}
      {messagesError ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {messagesError}
        </Alert>
      ) : null}
      {realtimeAlert}

      <Paper variant="outlined" sx={{ display: 'flex', minHeight: 520 }}>
        <Box
          sx={{
            width: 320,
            flexShrink: 0,
            borderRight: 1,
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box sx={{ p: 1.5 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Поиск: исполнитель, название задания"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </Box>
          <Divider />
          <Box ref={listScrollRef} sx={{ overflow: 'auto', flex: 1 }}>
            {listLoading ? (
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress size={28} />
              </Box>
            ) : (
              <List dense disablePadding>
                {filteredSummaries.length === 0 ? (
                  <ListItemText
                    sx={{ px: 2, py: 1 }}
                    primary={configured ? 'Нет потоков чата' : 'Чаты недоступны'}
                    secondary={
                      configured
                        ? 'Пока нет строк в task_chat_threads или нет доступа (RLS). После сообщения с мобильного поток появится здесь.'
                        : undefined
                    }
                  />
                ) : (
                  filteredSummaries.map((s) => {
                    const tid = String(s.thread.id ?? '');
                    const selected = tid === selectedThreadId;
                    const title = s.task?.title ?? `Задание ${String(s.thread.task_id ?? '').slice(0, 8) || '—'}`;
                    const worker = s.worker?.full_name ?? s.worker?.username ?? '—';
                    const tline = formatDateTime(
                      (s.latestMessageAt ?? s.thread.last_message_at) as string | undefined,
                    );
                    const sub = [s.latestMessagePreview, `${worker}`, tline].filter(Boolean).join(' · ');
                    const item = (
                      <ListItemButton selected={selected} onClick={() => setSelectedThreadId(tid)}>
                        <ListItemText
                          primaryTypographyProps={{ fontWeight: selected ? 700 : s.hasUnread ? 700 : 500 }}
                          primary={`${s.hasUnread ? '● ' : ''}${title}`}
                          secondary={sub}
                        />
                      </ListItemButton>
                    );
                    return <Box key={tid}>{item}</Box>;
                  })
                )}
              </List>
            )}
          </Box>
        </Box>

        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {!selectedThreadId ? (
            <Box sx={{ p: 3, color: 'text.secondary' }}>
              <Typography>Выберите чат слева или откройте из задания («Открыть чат»).</Typography>
            </Box>
          ) : (
            <>
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="subtitle1" fontWeight={700}>
                  {selectedSummary?.task?.title ?? 'Задание'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Исполнитель: {selectedSummary?.worker?.full_name ?? selectedSummary?.worker?.username ?? '—'}
                  {selectedTaskId ? (
                    <>
                      {' · '}
                      <Link component={RouterLink} to={`/tasks/${selectedTaskId}`} underline="hover">
                        Карточка задания
                      </Link>
                    </>
                  ) : null}
                </Typography>
              </Box>

              <Box sx={{ flex: 1, overflow: 'auto', p: 2, bgcolor: 'action.hover' }}>
                {messagesLoading ? (
                  <CircularProgress size={28} />
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {messages.map((m) => {
                      const msgText = getTaskChatMessageText(m as Record<string, unknown>);
                      const hasAttachments = (m.attachments?.length ?? 0) > 0;
                      const isMine = currentUserId && m.sender_user_id && String(m.sender_user_id) === currentUserId;
                      const rowMeta = m as Record<string, unknown>;
                      const isSystem =
                        m.sender_role === 'system' ||
                        rowMeta.message_type === 'system' ||
                        rowMeta.type === 'system';
                      if (!msgText.trim() && !hasAttachments && !isSystem) {
                        return <Fragment key={String(m.id ?? '')} />;
                      }
                      const name =
                        m.sender_profile?.full_name ??
                        m.sender_profile?.username ??
                        (isMine ? 'Вы' : 'Участник');
                      const align = isSystem ? 'center' : isMine ? 'flex-end' : 'flex-start';
                      const bubbleBg = isSystem
                        ? 'warning.light'
                        : isMine
                          ? 'primary.main'
                          : 'background.paper';
                      const bubbleColor = isSystem ? 'text.primary' : isMine ? 'primary.contrastText' : 'text.primary';

                      return (
                        <Box key={String(m.id)} sx={{ display: 'flex', justifyContent: align }}>
                          <Paper
                            elevation={0}
                            sx={{
                              maxWidth: '82%',
                              px: 1.5,
                              py: 1,
                              bgcolor: bubbleBg,
                              color: bubbleColor,
                              borderRadius: 2,
                              border: isSystem ? 1 : 0,
                              borderColor: 'warning.dark',
                            }}
                          >
                            <Typography variant="caption" sx={{ opacity: 0.9, display: 'block' }}>
                              {name} · {roleLabel(m.sender_role)}{' '}
                              {m.created_at ? formatDateTime(String(m.created_at)) : ''}
                            </Typography>
                            {msgText ? (
                              <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                                {msgText}
                              </Typography>
                            ) : hasAttachments ? (
                              <Typography variant="caption" sx={{ mt: 0.5, display: 'block', opacity: 0.85 }}>
                                Сообщение без текста (только вложение)
                              </Typography>
                            ) : null}
                            {m.attachments?.length ? (
                              <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                {m.attachments.map((att) => {
                                  const rawPath = getAttachmentStoragePath(att as Record<string, unknown>);
                                  const url = resolveChatAttachmentSignedUrl(att, m.signedUrls);
                                  const kind = inferAttachmentKind(
                                    att.mime_type ? String(att.mime_type) : undefined,
                                    att.file_name ? String(att.file_name) : undefined,
                                  );
                                  const label =
                                    att.file_name ?? (rawPath ? rawPath.split('/').pop() : null) ?? 'файл';

                                  if (kind === 'image') {
                                    return (
                                      <Box key={String(att.id ?? rawPath)}>
                                        {url ? (
                                          <>
                                            <Box
                                              component="img"
                                              src={url}
                                              alt={label}
                                              sx={{ maxWidth: '100%', maxHeight: 280, borderRadius: 1, display: 'block' }}
                                            />
                                            <Link href={url} target="_blank" rel="noopener noreferrer" variant="caption">
                                              Открыть / скачать
                                            </Link>
                                          </>
                                        ) : (
                                          <Typography variant="caption" color="error">
                                            Предпросмотр недоступен — проверьте bucket «
                                            {getAttachmentBucket(att as Record<string, unknown>)}», путь «
                                            {rawPath || '—'}» и политики Storage.
                                          </Typography>
                                        )}
                                      </Box>
                                    );
                                  }

                                  const FileIcon =
                                    kind === 'pdf'
                                      ? PictureAsPdfRoundedIcon
                                      : kind === 'video'
                                        ? VideoFileRoundedIcon
                                        : InsertDriveFileRoundedIcon;

                                  return (
                                    <Stack
                                      key={String(att.id ?? rawPath)}
                                      direction="row"
                                      alignItems="center"
                                      spacing={1}
                                      sx={{
                                        flexWrap: 'wrap',
                                        py: 0.5,
                                        px: 1,
                                        borderRadius: 1,
                                        bgcolor: isMine ? 'rgba(255,255,255,0.12)' : 'action.hover',
                                      }}
                                    >
                                      <FileIcon fontSize="small" sx={{ flexShrink: 0 }} />
                                      <Typography variant="body2" sx={{ flex: 1, minWidth: 120 }}>
                                        {label}
                                      </Typography>
                                      {url ? (
                                        <Button
                                          size="small"
                                          variant="outlined"
                                          href={url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          component={Link}
                                        >
                                          Открыть
                                        </Button>
                                      ) : (
                                        <Typography variant="caption" color="error">
                                          Нет ссылки
                                        </Typography>
                                      )}
                                    </Stack>
                                  );
                                })}
                              </Box>
                            ) : null}
                          </Paper>
                        </Box>
                      );
                    })}
                  </Box>
                )}
              </Box>

              <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                {pendingFiles.length > 0 ? (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                    Вложения: {pendingFiles.map((f) => f.name).join(', ')}
                  </Typography>
                ) : null}
                <input ref={fileInputRef} type="file" hidden multiple onChange={onPickFiles} />
                <TextField
                  fullWidth
                  multiline
                  minRows={2}
                  placeholder="Текст сообщения…"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  disabled={sending}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end" sx={{ alignSelf: 'flex-end', mb: 1 }}>
                        <IconButton aria-label="Вложение" onClick={() => fileInputRef.current?.click()} disabled={sending}>
                          <AttachFileRoundedIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                  <Button
                    variant="contained"
                    endIcon={sending ? <CircularProgress size={16} color="inherit" /> : <SendRoundedIcon />}
                    onClick={() => void onSend()}
                    disabled={sending || (!draft.trim() && pendingFiles.length === 0)}
                  >
                    Отправить
                  </Button>
                </Box>
              </Box>
            </>
          )}
        </Box>
      </Paper>
    </Box>
  );
}
