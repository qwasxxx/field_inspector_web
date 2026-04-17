-- RLS for inspection_reports (mobile writes rows; admin panel lists them).
-- Prerequisites: table public.inspection_reports exists; function public.is_admin(uuid) exists
-- (see 20260417120000_inspection_tasks_and_rls.sql).

ALTER TABLE public.inspection_reports ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.inspection_reports TO authenticated;

DROP POLICY IF EXISTS "inspection_reports_select_admin" ON public.inspection_reports;
CREATE POLICY "inspection_reports_select_admin"
  ON public.inspection_reports FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "inspection_reports_select_worker" ON public.inspection_reports;
CREATE POLICY "inspection_reports_select_worker"
  ON public.inspection_reports FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.inspection_task_assignments a
      WHERE a.task_id = inspection_reports.task_id
        AND a.worker_user_id = auth.uid()
        AND a.is_active = true
    )
  );

DROP POLICY IF EXISTS "inspection_reports_insert_worker" ON public.inspection_reports;
CREATE POLICY "inspection_reports_insert_worker"
  ON public.inspection_reports FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.inspection_task_assignments a
      WHERE a.task_id = inspection_reports.task_id
        AND a.worker_user_id = auth.uid()
        AND a.is_active = true
    )
  );
