-- Вложения отчётов: SELECT для админа и назначенного воркера; INSERT для воркера по заданию.
-- Убедитесь, что таблица public.inspection_media уже создана в проекте.
-- Для просмотра файлов в UI также нужна политика Storage на bucket inspection-media (чтение по signed URL).

ALTER TABLE public.inspection_media ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.inspection_media TO authenticated;

DROP POLICY IF EXISTS "inspection_media_select_admin" ON public.inspection_media;
CREATE POLICY "inspection_media_select_admin"
  ON public.inspection_media FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "inspection_media_select_worker" ON public.inspection_media;
CREATE POLICY "inspection_media_select_worker"
  ON public.inspection_media FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.inspection_task_assignments a
      WHERE a.task_id = inspection_media.task_id
        AND a.worker_user_id = auth.uid()
        AND a.is_active = true
    )
  );

DROP POLICY IF EXISTS "inspection_media_insert_worker" ON public.inspection_media;
CREATE POLICY "inspection_media_insert_worker"
  ON public.inspection_media FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.inspection_task_assignments a
      WHERE a.task_id = inspection_media.task_id
        AND a.worker_user_id = auth.uid()
        AND a.is_active = true
    )
  );
