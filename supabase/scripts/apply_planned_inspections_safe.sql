-- =============================================================================
-- Планирование обходов — БЕЗОПАСНОЕ одноразовое применение в Supabase SQL Editor
-- =============================================================================
-- НЕ делает: DROP TABLE, TRUNCATE, удаление чужих таблиц/данных.
-- Делает: при необходимости создаёт/обновляет только is_admin, две новые таблицы,
--         политики RLS на них, функцию dispatch_planned_inspections_due.
--
-- Перед изменениями проверяет, что есть public.profiles и public.inspection_tasks
-- (иначе скрипт прерывается и ничего не меняет).
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) THEN
    RAISE EXCEPTION
      'Нет таблицы public.profiles — сначала заведите профили пользователей. Скрипт прерван, данные не тронуты.';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'inspection_tasks'
  ) THEN
    RAISE EXCEPTION
      'Нет таблицы public.inspection_tasks — сначала примените миграцию заданий. Скрипт прерван, данные не тронуты.';
  END IF;
END $$;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Только определение функции (на таблицы и строки не влияет). Если уже была — тело совпадет с типовым проектом.
CREATE OR REPLACE FUNCTION public.is_admin (user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = user_id
      AND p.role = 'admin'
      AND p.is_active = true
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin (uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin (uuid) TO service_role;

CREATE TABLE IF NOT EXISTS public.planned_inspections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
  title text NOT NULL,
  site_name text,
  area_name text,
  shift_label text,
  instructions text,
  scheduled_at timestamptz NOT NULL,
  worker_user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'scheduled' CHECK (
    status IN ('scheduled', 'dispatched', 'cancelled')
  ),
  dispatched_task_id uuid REFERENCES public.inspection_tasks (id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users (id),
  created_at timestamptz NOT NULL DEFAULT now ()
);

CREATE TABLE IF NOT EXISTS public.planned_inspection_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
  planned_inspection_id uuid NOT NULL REFERENCES public.planned_inspections (id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  equipment_name text NOT NULL,
  equipment_location text,
  equipment_code text,
  created_at timestamptz NOT NULL DEFAULT now ()
);

CREATE INDEX IF NOT EXISTS idx_planned_inspections_status_scheduled_at
  ON public.planned_inspections (status, scheduled_at);

CREATE INDEX IF NOT EXISTS idx_planned_inspection_items_plan_id
  ON public.planned_inspection_items (planned_inspection_id, sort_order);

ALTER TABLE public.planned_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planned_inspection_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "planned_inspections_select_admin" ON public.planned_inspections;
CREATE POLICY "planned_inspections_select_admin"
  ON public.planned_inspections FOR SELECT TO authenticated
  USING (public.is_admin (auth.uid ()));

DROP POLICY IF EXISTS "planned_inspections_insert_admin" ON public.planned_inspections;
CREATE POLICY "planned_inspections_insert_admin"
  ON public.planned_inspections FOR INSERT TO authenticated
  WITH CHECK (public.is_admin (auth.uid ()));

DROP POLICY IF EXISTS "planned_inspections_update_admin" ON public.planned_inspections;
CREATE POLICY "planned_inspections_update_admin"
  ON public.planned_inspections FOR UPDATE TO authenticated
  USING (public.is_admin (auth.uid ()))
  WITH CHECK (public.is_admin (auth.uid ()));

DROP POLICY IF EXISTS "planned_inspections_delete_admin" ON public.planned_inspections;
CREATE POLICY "planned_inspections_delete_admin"
  ON public.planned_inspections FOR DELETE TO authenticated
  USING (public.is_admin (auth.uid ()));

DROP POLICY IF EXISTS "planned_inspection_items_select_admin" ON public.planned_inspection_items;
CREATE POLICY "planned_inspection_items_select_admin"
  ON public.planned_inspection_items FOR SELECT TO authenticated
  USING (public.is_admin (auth.uid ()));

DROP POLICY IF EXISTS "planned_inspection_items_insert_admin" ON public.planned_inspection_items;
CREATE POLICY "planned_inspection_items_insert_admin"
  ON public.planned_inspection_items FOR INSERT TO authenticated
  WITH CHECK (public.is_admin (auth.uid ()));

DROP POLICY IF EXISTS "planned_inspection_items_update_admin" ON public.planned_inspection_items;
CREATE POLICY "planned_inspection_items_update_admin"
  ON public.planned_inspection_items FOR UPDATE TO authenticated
  USING (public.is_admin (auth.uid ()))
  WITH CHECK (public.is_admin (auth.uid ()));

DROP POLICY IF EXISTS "planned_inspection_items_delete_admin" ON public.planned_inspection_items;
CREATE POLICY "planned_inspection_items_delete_admin"
  ON public.planned_inspection_items FOR DELETE TO authenticated
  USING (public.is_admin (auth.uid ()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.planned_inspections TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.planned_inspection_items TO authenticated;

COMMENT ON TABLE public.planned_inspections IS 'Admin-scheduled patrols; dispatch materializes inspection_tasks for workers.';
COMMENT ON TABLE public.planned_inspection_items IS 'Route equipment rows for a planned inspection.';

CREATE OR REPLACE FUNCTION public.dispatch_planned_inspections_due ()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  allowed boolean;
  r RECORD;
  new_task_id uuid;
  n integer := 0;
BEGIN
  allowed :=
    (auth.role () = 'service_role')
    OR public.is_admin (auth.uid ());
  IF NOT allowed THEN
    RAISE EXCEPTION 'dispatch_planned_inspections_due: not allowed';
  END IF;

  FOR r IN
    SELECT pi.*
    FROM public.planned_inspections pi
    WHERE pi.status = 'scheduled'
      AND pi.scheduled_at <= now ()
    ORDER BY pi.scheduled_at
    FOR UPDATE OF pi SKIP LOCKED
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM public.planned_inspection_items i
      WHERE i.planned_inspection_id = r.id
    ) THEN
      CONTINUE;
    END IF;

    INSERT INTO public.inspection_tasks (
      title,
      site_name,
      area_name,
      shift_label,
      instructions,
      due_at,
      status,
      created_by
    )
    VALUES (
      r.title,
      r.site_name,
      r.area_name,
      r.shift_label,
      r.instructions,
      r.scheduled_at,
      'assigned',
      r.created_by
    )
    RETURNING id INTO new_task_id;

    INSERT INTO public.inspection_task_items (
      task_id,
      sort_order,
      equipment_name,
      equipment_location,
      equipment_code
    )
    SELECT
      new_task_id,
      pii.sort_order,
      pii.equipment_name,
      pii.equipment_location,
      pii.equipment_code
    FROM public.planned_inspection_items pii
    WHERE pii.planned_inspection_id = r.id
    ORDER BY pii.sort_order;

    INSERT INTO public.inspection_task_assignments (
      task_id,
      worker_user_id,
      assigned_by,
      is_active,
      execution_status
    )
    VALUES (
      new_task_id,
      r.worker_user_id,
      r.created_by,
      true,
      'assigned'
    );

    UPDATE public.planned_inspections
    SET
      status = 'dispatched',
      dispatched_task_id = new_task_id
    WHERE id = r.id;

    n := n + 1;
  END LOOP;

  RETURN n;
END;
$$;

REVOKE ALL ON FUNCTION public.dispatch_planned_inspections_due () FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.dispatch_planned_inspections_due () TO authenticated;
GRANT EXECUTE ON FUNCTION public.dispatch_planned_inspections_due () TO service_role;

-- Готово. Обновите страницу /planning во фронте.
