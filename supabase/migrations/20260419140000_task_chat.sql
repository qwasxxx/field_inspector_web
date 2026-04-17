-- Task-scoped chat: one thread per inspection task, messages, attachments, read markers.
-- Storage bucket: task-chat-media. Paths: tasks/<task_id>/<message_id>/<ts>_<filename>
-- MANUAL: apply in Supabase SQL Editor or `supabase db push` after review.
-- Requires public.is_admin(uuid) from prior migrations.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.task_chat_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.inspection_tasks (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_message_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS task_chat_threads_task_id_key
  ON public.task_chat_threads (task_id);

CREATE TABLE IF NOT EXISTS public.task_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.task_chat_threads (id) ON DELETE CASCADE,
  sender_user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  sender_role text NOT NULL DEFAULT 'worker' CHECK (sender_role IN ('admin', 'worker', 'system')),
  body text,
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_task_chat_messages_thread_id_created_at
  ON public.task_chat_messages (thread_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.task_chat_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.task_chat_messages (id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  file_name text,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_task_chat_attachments_message_id
  ON public.task_chat_attachments (message_id);

CREATE TABLE IF NOT EXISTS public.task_chat_reads (
  thread_id uuid NOT NULL REFERENCES public.task_chat_threads (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  last_read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (thread_id, user_id)
);

-- ---------------------------------------------------------------------------
-- Maintain last_message_at on thread
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.task_chat_touch_thread_last_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.task_chat_threads
  SET last_message_at = NEW.created_at
  WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS task_chat_messages_touch_thread ON public.task_chat_messages;
CREATE TRIGGER task_chat_messages_touch_thread
  AFTER INSERT ON public.task_chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.task_chat_touch_thread_last_message();

-- ---------------------------------------------------------------------------
-- RLS helpers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.can_access_task_chat_task(p_task_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.inspection_task_assignments a
      WHERE a.task_id = p_task_id
        AND a.worker_user_id = auth.uid()
        AND a.is_active = true
    );
$$;

GRANT EXECUTE ON FUNCTION public.can_access_task_chat_task(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_chat_threads TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_chat_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_chat_attachments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_chat_reads TO authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE public.task_chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_chat_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_chat_reads ENABLE ROW LEVEL SECURITY;

-- threads
DROP POLICY IF EXISTS "task_chat_threads_select" ON public.task_chat_threads;
CREATE POLICY "task_chat_threads_select"
  ON public.task_chat_threads FOR SELECT TO authenticated
  USING (public.can_access_task_chat_task(task_id));

DROP POLICY IF EXISTS "task_chat_threads_insert" ON public.task_chat_threads;
CREATE POLICY "task_chat_threads_insert"
  ON public.task_chat_threads FOR INSERT TO authenticated
  WITH CHECK (public.can_access_task_chat_task(task_id));

DROP POLICY IF EXISTS "task_chat_threads_update" ON public.task_chat_threads;
CREATE POLICY "task_chat_threads_update"
  ON public.task_chat_threads FOR UPDATE TO authenticated
  USING (public.can_access_task_chat_task(task_id))
  WITH CHECK (public.can_access_task_chat_task(task_id));

DROP POLICY IF EXISTS "task_chat_threads_delete" ON public.task_chat_threads;
CREATE POLICY "task_chat_threads_delete"
  ON public.task_chat_threads FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- messages
DROP POLICY IF EXISTS "task_chat_messages_select" ON public.task_chat_messages;
CREATE POLICY "task_chat_messages_select"
  ON public.task_chat_messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.task_chat_threads t
      WHERE t.id = task_chat_messages.thread_id
        AND public.can_access_task_chat_task(t.task_id)
    )
  );

DROP POLICY IF EXISTS "task_chat_messages_insert" ON public.task_chat_messages;
CREATE POLICY "task_chat_messages_insert"
  ON public.task_chat_messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.task_chat_threads t
      WHERE t.id = task_chat_messages.thread_id
        AND public.can_access_task_chat_task(t.task_id)
    )
    AND (
      (
        is_system = false
        AND sender_role IN ('admin', 'worker')
      )
      OR (
        is_system = true
        AND sender_role = 'system'
        AND public.is_admin(auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "task_chat_messages_delete" ON public.task_chat_messages;
CREATE POLICY "task_chat_messages_delete"
  ON public.task_chat_messages FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- attachments
DROP POLICY IF EXISTS "task_chat_attachments_select" ON public.task_chat_attachments;
CREATE POLICY "task_chat_attachments_select"
  ON public.task_chat_attachments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.task_chat_messages m
      JOIN public.task_chat_threads t ON t.id = m.thread_id
      WHERE m.id = task_chat_attachments.message_id
        AND public.can_access_task_chat_task(t.task_id)
    )
  );

DROP POLICY IF EXISTS "task_chat_attachments_insert" ON public.task_chat_attachments;
CREATE POLICY "task_chat_attachments_insert"
  ON public.task_chat_attachments FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.task_chat_messages m
      JOIN public.task_chat_threads t ON t.id = m.thread_id
      WHERE m.id = task_chat_attachments.message_id
        AND m.sender_user_id = auth.uid()
        AND public.can_access_task_chat_task(t.task_id)
    )
  );

DROP POLICY IF EXISTS "task_chat_attachments_delete" ON public.task_chat_attachments;
CREATE POLICY "task_chat_attachments_delete"
  ON public.task_chat_attachments FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- reads
DROP POLICY IF EXISTS "task_chat_reads_select" ON public.task_chat_reads;
CREATE POLICY "task_chat_reads_select"
  ON public.task_chat_reads FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "task_chat_reads_insert" ON public.task_chat_reads;
CREATE POLICY "task_chat_reads_insert"
  ON public.task_chat_reads FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.task_chat_threads t
      WHERE t.id = task_chat_reads.thread_id
        AND public.can_access_task_chat_task(t.task_id)
    )
  );

DROP POLICY IF EXISTS "task_chat_reads_update" ON public.task_chat_reads;
CREATE POLICY "task_chat_reads_update"
  ON public.task_chat_reads FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Storage bucket + policies (private bucket; access via signed URLs in UI)
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('task-chat-media', 'task-chat-media', false)
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.task_id_from_chat_storage_path(path text)
RETURNS uuid
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT NULLIF(split_part(path, '/', 2), '')::uuid;
$$;

DROP POLICY IF EXISTS "task_chat_media_select" ON storage.objects;
CREATE POLICY "task_chat_media_select"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'task-chat-media'
    AND public.can_access_task_chat_task(public.task_id_from_chat_storage_path(name))
  );

DROP POLICY IF EXISTS "task_chat_media_insert" ON storage.objects;
CREATE POLICY "task_chat_media_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'task-chat-media'
    AND public.can_access_task_chat_task(public.task_id_from_chat_storage_path(name))
  );

DROP POLICY IF EXISTS "task_chat_media_update" ON storage.objects;
CREATE POLICY "task_chat_media_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'task-chat-media'
    AND public.can_access_task_chat_task(public.task_id_from_chat_storage_path(name))
  )
  WITH CHECK (
    bucket_id = 'task-chat-media'
    AND public.can_access_task_chat_task(public.task_id_from_chat_storage_path(name))
  );

DROP POLICY IF EXISTS "task_chat_media_delete" ON storage.objects;
CREATE POLICY "task_chat_media_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'task-chat-media'
    AND (
      public.is_admin(auth.uid())
      OR public.can_access_task_chat_task(public.task_id_from_chat_storage_path(name))
    )
  );

-- ---------------------------------------------------------------------------
-- Realtime (Supabase)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.task_chat_threads;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.task_chat_messages;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.task_chat_attachments;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.task_chat_reads;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
