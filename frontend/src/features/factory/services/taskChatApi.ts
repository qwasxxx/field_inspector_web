import type { PostgrestError, RealtimeChannel } from '@supabase/supabase-js';
import type {
  InspectionTaskAssignmentRow,
  InspectionTaskRow,
  ProfileRow,
  SupabaseResult,
  TaskChatAttachmentRow,
  TaskChatMessageRow,
  TaskChatThreadRow,
} from '@/entities/factory/model/types';
import { getTaskChatMessageText, taskChatMessageTextColumn } from '@/shared/lib/taskChatMessageText';
import {
  attachmentSignedUrlMapKey,
  getAttachmentBucket,
  getAttachmentStoragePath,
  getTaskChatMediaBucket,
  normalizeStoragePathForBucket,
} from '@/shared/lib/taskChatStorage';
import { getSupabaseClient, isSupabaseConfigured } from '@/shared/lib/supabase/client';

export type TaskChatThreadSummary = {
  thread: TaskChatThreadRow;
  task: InspectionTaskRow | null;
  worker: ProfileRow | null;
  lastReadAt: string | null;
  latestMessageSenderId: string | null;
  hasUnread: boolean;
  /** Превью последнего сообщения (текст или «Вложение»). */
  latestMessagePreview: string | null;
  /** Время последнего сообщения (из строки сообщения или потока). */
  latestMessageAt: string | null;
};

export type TaskChatMessageWithMeta = TaskChatMessageRow & {
  sender_profile: ProfileRow | null;
  attachments: TaskChatAttachmentRow[];
  signedUrls: Record<string, string | null>;
};

function logErr(ctx: string, err: PostgrestError) {
  console.error(`[taskChatApi] ${ctx}`, err.message, err.code, err.details, err.hint);
}

function ruErr(stage: string, err: PostgrestError): string {
  logErr(stage, err);
  const rls =
    err.code === '42501' ||
    /permission denied|row-level security|new row violates row-level security/i.test(err.message);
  const rlsRu = rls ? 'Отклонено политикой безопасности (RLS). ' : '';
  return `${stage}: ${rlsRu}${err.message}`.trim();
}

function assignmentWorkerId(a: InspectionTaskAssignmentRow | null): string | null {
  if (!a) return null;
  const id = a.worker_user_id ?? a.worker_id ?? a.profile_id;
  return id ? String(id) : null;
}

/** Sıralama: last_message_at desc; biri yoksa diğeri üstte; ikisi de yoksa created_at desc. */
export function compareTaskChatThreadRows(a: TaskChatThreadRow, b: TaskChatThreadRow): number {
  const la = a.last_message_at ? new Date(String(a.last_message_at)).getTime() : NaN;
  const lb = b.last_message_at ? new Date(String(b.last_message_at)).getTime() : NaN;
  const ca = new Date(String(a.created_at ?? 0)).getTime();
  const cb = new Date(String(b.created_at ?? 0)).getTime();
  if (!Number.isNaN(la) && !Number.isNaN(lb) && la !== lb) return lb - la;
  if (!Number.isNaN(la) && Number.isNaN(lb)) return -1;
  if (Number.isNaN(la) && !Number.isNaN(lb)) return 1;
  return cb - ca;
}

export function sanitizeChatFileName(name: string): string {
  const base = name.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 180);
  return base || 'file';
}

export async function getCurrentUserId(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = getSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}

async function resolveSenderRole(userId: string): Promise<'admin' | 'worker'> {
  const supabase = getSupabaseClient();
  const { data } = await supabase.from('profiles').select('role').eq('id', userId).maybeSingle();
  const r = (data as { role?: string } | null)?.role;
  return r === 'admin' ? 'admin' : 'worker';
}

/** Canlı şemada thread satırından task_id (UI özetinde yoksa veya gecikmeli yükleniyorsa). */
async function resolveTaskIdForThread(threadId: string): Promise<string | null> {
  const id = threadId?.trim();
  if (!id) return null;
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from('task_chat_threads').select('task_id').eq('id', id).maybeSingle();
  if (error) {
    console.error('[taskChatApi] resolveTaskIdForThread query failed', {
      threadId: id,
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    return null;
  }
  const tid = (data as { task_id?: string | null } | null)?.task_id;
  return tid != null && String(tid).trim() !== '' ? String(tid).trim() : null;
}

type ThreadMessagePeek = {
  senderId: string | null;
  createdAt: string | null;
  messageId: string | null;
  previewText: string;
};

/** Последнее сообщение по каждому потоку: отправитель, время, превью текста / вложения. */
async function fetchLatestThreadMessagePeeks(
  threadIds: string[],
): Promise<Map<string, ThreadMessagePeek>> {
  const out = new Map<string, ThreadMessagePeek>();
  if (threadIds.length === 0) return out;
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('task_chat_messages')
    .select('*')
    .in('thread_id', threadIds)
    .order('created_at', { ascending: false });

  if (error || !data) return out;

  const firstMessageIds: string[] = [];
  for (const row of data as TaskChatMessageRow[]) {
    const tid = row.thread_id ? String(row.thread_id) : '';
    if (!tid || out.has(tid)) continue;
    const mid = row.id ? String(row.id) : null;
    const previewText = getTaskChatMessageText(row as Record<string, unknown>);
    out.set(tid, {
      senderId: row.sender_user_id ? String(row.sender_user_id) : null,
      createdAt: row.created_at ? String(row.created_at) : null,
      messageId: mid,
      previewText,
    });
    if (mid) firstMessageIds.push(mid);
  }

  const withAttachment = new Set<string>();
  if (firstMessageIds.length > 0) {
    const { data: attRows } = await supabase
      .from('task_chat_attachments')
      .select('message_id')
      .in('message_id', firstMessageIds);
    for (const a of attRows ?? []) {
      const mid = (a as { message_id?: string }).message_id;
      if (mid) withAttachment.add(String(mid));
    }
  }

  for (const [tid, peek] of out) {
    if (!peek.previewText && peek.messageId && withAttachment.has(peek.messageId)) {
      out.set(tid, { ...peek, previewText: '📎 Вложение' });
    }
  }

  return out;
}

export async function fetchTaskChatThreadSummaries(): Promise<SupabaseResult<TaskChatThreadSummary[]>> {
  if (!isSupabaseConfigured()) {
    return { data: [], error: null };
  }
  const uid = await getCurrentUserId();
  if (!uid) {
    return {
      data: [],
      error:
        'Admin panelinde Supabase oturumu yok. Mobil ile aynı projede e-posta ve şifreyle giriş yapın.',
    };
  }

  try {
    const supabase = getSupabaseClient();
    const { data: threads, error: tErr } = await supabase.from('task_chat_threads').select('*');

    if (tErr) {
      return { data: [], error: ruErr('Загрузка чатов (task_chat_threads)', tErr) };
    }

    const threadRows = (threads ?? []) as TaskChatThreadRow[];
    threadRows.sort(compareTaskChatThreadRows);
    const threadIds = threadRows.map((t) => String(t.id ?? '')).filter(Boolean);
    const taskIds = [...new Set(threadRows.map((t) => String(t.task_id ?? '')).filter(Boolean))];

    const tasksById = new Map<string, InspectionTaskRow>();
    if (taskIds.length > 0) {
      const { data: taskRows, error: taskErr } = await supabase
        .from('inspection_tasks')
        .select('*')
        .in('id', taskIds);
      if (taskErr) {
        console.warn('[taskChatApi] inspection_tasks (часть метаданных недоступна)', taskErr.message);
      } else {
        for (const tr of (taskRows ?? []) as InspectionTaskRow[]) {
          if (tr.id) tasksById.set(String(tr.id), tr);
        }
      }
    }

    const workerByTask = new Map<string, ProfileRow | null>();
    for (const taskId of taskIds) {
      const { data: assignment } = await supabase
        .from('inspection_task_assignments')
        .select('*')
        .eq('task_id', taskId)
        .maybeSingle();
      const a = assignment as InspectionTaskAssignmentRow | null;
      const pid = assignmentWorkerId(a);
      let worker: ProfileRow | null = null;
      if (pid) {
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', pid).maybeSingle();
        if (prof) worker = prof as ProfileRow;
      }
      workerByTask.set(taskId, worker);
    }

    const readsByThread = new Map<string, string | null>();
    if (threadIds.length > 0) {
      const { data: reads, error: rErr } = await supabase
        .from('task_chat_reads')
        .select('thread_id, last_read_at')
        .eq('user_id', uid)
        .in('thread_id', threadIds);
      if (rErr) {
        console.warn('[taskChatApi] task_chat_reads', rErr.message);
      } else {
        for (const r of reads ?? []) {
          const row = r as { thread_id?: string; last_read_at?: string | null };
          if (row.thread_id) readsByThread.set(String(row.thread_id), row.last_read_at ?? null);
        }
      }
    }

    const peekByThread = await fetchLatestThreadMessagePeeks(threadIds);

    const senderIdsNeedingProfile = new Set<string>();
    for (const thread of threadRows) {
      const taskId = String(thread.task_id ?? '');
      const worker = taskId ? workerByTask.get(taskId) ?? null : null;
      const tid = String(thread.id ?? '');
      const peek = tid ? peekByThread.get(tid) : undefined;
      if (!worker && peek?.senderId) senderIdsNeedingProfile.add(peek.senderId);
    }
    const profileBySenderId = new Map<string, ProfileRow>();
    if (senderIdsNeedingProfile.size > 0) {
      const { data: profRows } = await supabase
        .from('profiles')
        .select('*')
        .in('id', [...senderIdsNeedingProfile]);
      for (const p of (profRows ?? []) as ProfileRow[]) {
        if (p.id) profileBySenderId.set(String(p.id), p);
      }
    }

    const summaries: TaskChatThreadSummary[] = threadRows.map((thread) => {
      const tid = String(thread.id ?? '');
      const taskId = String(thread.task_id ?? '');
      const task = taskId ? tasksById.get(taskId) ?? null : null;
      let worker = taskId ? workerByTask.get(taskId) ?? null : null;
      const peek = tid ? peekByThread.get(tid) : undefined;
      if (!worker && peek?.senderId) {
        worker = profileBySenderId.get(peek.senderId) ?? null;
      }
      const lastReadAt = tid ? readsByThread.get(tid) ?? null : null;
      const latestMessageSenderId = peek?.senderId ?? null;
      const lastMsgAt =
        peek?.createdAt ??
        (thread.last_message_at ? String(thread.last_message_at) : null);
      let hasUnread = false;
      if (lastMsgAt && latestMessageSenderId && latestMessageSenderId !== uid) {
        if (!lastReadAt) hasUnread = true;
        else hasUnread = new Date(lastMsgAt).getTime() > new Date(lastReadAt).getTime();
      }
      const previewTrim = peek?.previewText?.trim() ?? '';
      return {
        thread,
        task,
        worker,
        lastReadAt,
        latestMessageSenderId,
        hasUnread,
        latestMessagePreview: previewTrim.length > 0 ? previewTrim : null,
        latestMessageAt: lastMsgAt,
      };
    });

    return { data: summaries, error: null };
  } catch (e) {
    console.error('[taskChatApi.fetchTaskChatThreadSummaries]', e);
    return { data: [], error: e instanceof Error ? e.message : String(e) };
  }
}

export async function ensureThreadForTask(taskId: string): Promise<SupabaseResult<{ threadId: string | null }>> {
  if (!isSupabaseConfigured()) {
    return { data: { threadId: null }, error: 'Supabase не настроен.' };
  }
  const tid = taskId?.trim();
  if (!tid) {
    return { data: { threadId: null }, error: 'Не указан task_id.' };
  }

  try {
    const supabase = getSupabaseClient();
    const { data: existing, error: exErr } = await supabase
      .from('task_chat_threads')
      .select('id')
      .eq('task_id', tid)
      .maybeSingle();

    if (exErr) {
      return { data: { threadId: null }, error: ruErr('Поиск чата', exErr) };
    }
    const exId = (existing as { id?: string } | null)?.id;
    if (exId) {
      return { data: { threadId: String(exId) }, error: null };
    }

    const { data: inserted, error: insErr } = await supabase
      .from('task_chat_threads')
      .insert({ task_id: tid })
      .select('id')
      .single();

    if (!insErr) {
      const id = (inserted as { id?: string })?.id ?? null;
      return { data: { threadId: id ? String(id) : null }, error: null };
    }

    if (insErr.code === '23505') {
      const { data: again } = await supabase.from('task_chat_threads').select('id').eq('task_id', tid).maybeSingle();
      const id = (again as { id?: string } | null)?.id ?? null;
      return { data: { threadId: id ? String(id) : null }, error: null };
    }

    return { data: { threadId: null }, error: ruErr('Создание чата', insErr) };
  } catch (e) {
    console.error('[taskChatApi.ensureThreadForTask]', e);
    return { data: { threadId: null }, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function fetchTaskChatMessages(threadId: string): Promise<SupabaseResult<TaskChatMessageWithMeta[]>> {
  if (!isSupabaseConfigured()) {
    return { data: [], error: null };
  }
  const id = threadId?.trim();
  if (!id) {
    return { data: [], error: 'Не указан thread_id.' };
  }

  try {
    const supabase = getSupabaseClient();
    const { data: messages, error: mErr } = await supabase
      .from('task_chat_messages')
      .select('*')
      .eq('thread_id', id)
      .order('created_at', { ascending: true });

    if (mErr) {
      console.error('[taskChatApi] task_chat_messages select failed', {
        threadId: id,
        code: mErr.code,
        message: mErr.message,
        details: mErr.details,
        hint: mErr.hint,
      });
      return { data: [], error: ruErr('Загрузка сообщений', mErr) };
    }

    const msgRows = (messages ?? []) as TaskChatMessageRow[];
    const msgIds = msgRows.map((m) => String(m.id ?? '')).filter(Boolean);

    const attachmentsByMessage = new Map<string, TaskChatAttachmentRow[]>();
    if (msgIds.length > 0) {
      const { data: atts, error: aErr } = await supabase
        .from('task_chat_attachments')
        .select('*')
        .in('message_id', msgIds);
      if (aErr) {
        console.error('[taskChatApi] task_chat_attachments select failed', {
          threadId: id,
          code: aErr.code,
          message: aErr.message,
          details: aErr.details,
          hint: aErr.hint,
        });
        return { data: [], error: ruErr('Загрузка вложений', aErr) };
      }
      for (const a of (atts ?? []) as TaskChatAttachmentRow[]) {
        const mid = a.message_id ? String(a.message_id) : '';
        if (!mid) continue;
        const list = attachmentsByMessage.get(mid) ?? [];
        list.push(a);
        attachmentsByMessage.set(mid, list);
      }
    }

    const senderIds = [...new Set(msgRows.map((m) => String(m.sender_user_id ?? '')).filter(Boolean))];
    const profilesById = new Map<string, ProfileRow>();
    for (const sid of senderIds) {
      const { data: p } = await supabase.from('profiles').select('*').eq('id', sid).maybeSingle();
      if (p) profilesById.set(sid, p as ProfileRow);
    }

    const signTargets = new Map<string, { bucket: string; norm: string }>();
    for (const m of msgRows) {
      const mid = String(m.id ?? '');
      const attachments = mid ? attachmentsByMessage.get(mid) ?? [] : [];
      for (const att of attachments) {
        const b = getAttachmentBucket(att as Record<string, unknown>);
        const raw = getAttachmentStoragePath(att as Record<string, unknown>);
        const norm = normalizeStoragePathForBucket(raw, b);
        if (norm) signTargets.set(attachmentSignedUrlMapKey(b, norm), { bucket: b, norm });
      }
    }

    const signedByKey = new Map<string, string | null>();
    for (const { bucket: bkt, norm } of signTargets.values()) {
      const key = attachmentSignedUrlMapKey(bkt, norm);
      const { data: su, error: suErr } = await supabase.storage.from(bkt).createSignedUrl(norm, 86_400);
      if (suErr) {
        console.error('[taskChatApi] createSignedUrl failed', {
          bucket: bkt,
          norm,
          message: suErr.message,
          name: suErr.name,
        });
        const { data: pub } = supabase.storage.from(bkt).getPublicUrl(norm);
        const pubUrl = pub?.publicUrl ?? null;
        signedByKey.set(key, pubUrl);
      } else {
        signedByKey.set(key, su?.signedUrl ?? null);
      }
    }

    const withMeta: TaskChatMessageWithMeta[] = [];
    for (const m of msgRows) {
      const mid = String(m.id ?? '');
      const sid = m.sender_user_id ? String(m.sender_user_id) : '';
      const attachments = mid ? attachmentsByMessage.get(mid) ?? [] : [];
      const signedUrls: Record<string, string | null> = {};
      for (const att of attachments) {
        const b = getAttachmentBucket(att as Record<string, unknown>);
        const raw = getAttachmentStoragePath(att as Record<string, unknown>);
        if (!raw) continue;
        const norm = normalizeStoragePathForBucket(raw, b);
        const urlFromNorm = norm ? signedByKey.get(attachmentSignedUrlMapKey(b, norm)) ?? null : null;
        signedUrls[attachmentSignedUrlMapKey(b, raw)] = urlFromNorm;
        if (norm && norm !== raw) {
          signedUrls[attachmentSignedUrlMapKey(b, norm)] = urlFromNorm;
        }
      }
      withMeta.push({
        ...m,
        sender_profile: sid ? profilesById.get(sid) ?? null : null,
        attachments,
        signedUrls,
      });
    }

    return { data: withMeta, error: null };
  } catch (e) {
    console.error('[taskChatApi.fetchTaskChatMessages]', e);
    return { data: [], error: e instanceof Error ? e.message : String(e) };
  }
}

export async function markTaskChatThreadRead(threadId: string): Promise<SupabaseResult<void>> {
  if (!isSupabaseConfigured()) {
    return { data: undefined, error: 'Supabase не настроен.' };
  }
  const uid = await getCurrentUserId();
  if (!uid) {
    return { data: undefined, error: 'Нет сессии.' };
  }
  const id = threadId?.trim();
  if (!id) {
    return { data: undefined, error: 'Нет thread_id.' };
  }

  try {
    const supabase = getSupabaseClient();
    const now = new Date().toISOString();
    const { error } = await supabase.from('task_chat_reads').upsert(
      {
        thread_id: id,
        user_id: uid,
        last_read_at: now,
      },
      { onConflict: 'thread_id,user_id' },
    );
    if (error) {
      return { data: undefined, error: ruErr('Обновление прочтения', error) };
    }
    return { data: undefined, error: null };
  } catch (e) {
    console.error('[taskChatApi.markTaskChatThreadRead]', e);
    return { data: undefined, error: e instanceof Error ? e.message : String(e) };
  }
}

export type SendTaskChatMessageInput = {
  threadId: string;
  /** Özetten gelir; boşsa `task_chat_threads` üzerinden çözülür. */
  taskId?: string;
  text: string;
  files: File[];
};

const SEND_FAIL_USER = 'Mesaj gönderilemedi. Lütfen tekrar deneyin.';
const SEND_NO_SESSION_USER = 'Oturum bulunamadı. Lütfen tekrar giriş yapın.';
const SEND_EMPTY_USER = 'Lütfen metin yazın veya dosya ekleyin.';
const SEND_ATTACH_PARTIAL_USER =
  'Mesajınız kaydedildi; bazı ekler yüklenemedi. Lütfen tekrar deneyin.';

function logPostgrest(ctx: string, err: PostgrestError, extra?: Record<string, unknown>) {
  console.error(`[taskChatApi] ${ctx}`, {
    code: err.code,
    message: err.message,
    details: err.details,
    hint: err.hint,
    ...extra,
  });
}

export async function sendTaskChatMessage(
  input: SendTaskChatMessageInput,
): Promise<SupabaseResult<{ messageId: string | null }>> {
  if (!isSupabaseConfigured()) {
    return { data: { messageId: null }, error: SEND_FAIL_USER };
  }
  const supabase = getSupabaseClient();
  const {
    data: { session },
    error: sessionErr,
  } = await supabase.auth.getSession();
  if (sessionErr || !session?.user?.id) {
    if (sessionErr) console.error('[taskChatApi.sendTaskChatMessage] getSession', sessionErr);
    return { data: { messageId: null }, error: SEND_NO_SESSION_USER };
  }
  const userId = session.user.id;
  const threadId = input.threadId.trim();
  const textVal = input.text.trim() || null;
  if (!textVal && input.files.length === 0) {
    return { data: { messageId: null }, error: SEND_EMPTY_USER };
  }

  let resolvedTaskId = input.taskId?.trim() ?? '';
  if (!resolvedTaskId) {
    resolvedTaskId = (await resolveTaskIdForThread(threadId)) ?? '';
  }
  if (!resolvedTaskId) {
    console.error('[taskChatApi.sendTaskChatMessage] resolved task_id is null — insert skipped', {
      threadId,
      inputTaskId: input.taskId,
      sessionUserId: userId,
    });
    return { data: { messageId: null }, error: SEND_FAIL_USER };
  }

  try {
    const textColumn = taskChatMessageTextColumn();
    const senderRole = await resolveSenderRole(userId);
    const insertPayload: Record<string, unknown> = {
      thread_id: threadId,
      task_id: resolvedTaskId,
      sender_user_id: userId,
      sender_role: senderRole,
      [textColumn]: textVal,
    };

    const { data: msgRow, error: insErr } = await supabase
      .from('task_chat_messages')
      .insert(insertPayload)
      .select('id')
      .single();

    if (insErr) {
      logPostgrest('sendTaskChatMessage insert task_chat_messages', insErr, {
        threadId,
        resolvedTaskId,
        textColumn,
        payload: insertPayload,
        sessionUserId: userId,
        senderRole,
      });
      return { data: { messageId: null }, error: SEND_FAIL_USER };
    }
    const messageId = (msgRow as { id?: string })?.id ?? null;
    if (!messageId) {
      console.error('[taskChatApi.sendTaskChatMessage] insert returned no id', {
        msgRow,
        threadId,
        resolvedTaskId,
        payload: insertPayload,
      });
      return { data: { messageId: null }, error: SEND_FAIL_USER };
    }

    const uploadErrors: string[] = [];
    for (const file of input.files) {
      const ts = Date.now();
      const safe = sanitizeChatFileName(file.name);
      const path = `tasks/${resolvedTaskId}/${messageId}/${ts}_${safe}`;
      const { error: upErr } = await supabase.storage.from(getTaskChatMediaBucket()).upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || undefined,
      });
      if (upErr) {
        console.error('[taskChatApi.sendTaskChatMessage] storage upload', { file: file.name, error: upErr });
        uploadErrors.push(`${file.name}: ${upErr.message}`);
        continue;
      }
      const { error: attErr } = await supabase.from('task_chat_attachments').insert({
        message_id: messageId,
        storage_path: path,
        file_name: file.name,
        mime_type: file.type || null,
        size_bytes: file.size,
      });
      if (attErr) {
        logPostgrest(`sendTaskChatMessage attachment insert (${file.name})`, attErr);
        uploadErrors.push(`${file.name}: ${attErr.message}`);
      }
    }

    if (uploadErrors.length > 0) {
      console.error('[taskChatApi.sendTaskChatMessage] partial attachment failures', uploadErrors);
      return {
        data: { messageId: String(messageId) },
        error: SEND_ATTACH_PARTIAL_USER,
      };
    }

    return { data: { messageId: String(messageId) }, error: null };
  } catch (e) {
    console.error('[taskChatApi.sendTaskChatMessage]', e);
    return { data: { messageId: null }, error: SEND_FAIL_USER };
  }
}

export type TaskChatRealtimeStatus =
  | 'SUBSCRIBED'
  | 'CHANNEL_ERROR'
  | 'TIMED_OUT'
  | 'CLOSED'
  | string;

export function subscribeAdminTaskChat(options: {
  onChange: () => void;
  onStatus: (status: TaskChatRealtimeStatus) => void;
}): () => void {
  if (!isSupabaseConfigured()) {
    return () => {};
  }
  const supabase = getSupabaseClient();
  const channel: RealtimeChannel = supabase
    .channel('admin-task-chat-global')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'task_chat_messages' },
      () => options.onChange(),
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'task_chat_threads' },
      () => options.onChange(),
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'task_chat_attachments' },
      () => options.onChange(),
    )
    .on('postgres_changes', { event: '*', schema: 'public', table: 'task_chat_reads' }, () =>
      options.onChange(),
    );

  channel.subscribe((status) => {
    options.onStatus(status);
    if (status === 'SUBSCRIBED') {
      options.onChange();
    }
  });

  return () => {
    void supabase.removeChannel(channel);
  };
}
