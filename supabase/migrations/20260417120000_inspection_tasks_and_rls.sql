-- Shared schema for web admin panel + mobile app (Supabase / PostgreSQL).
-- MANUAL STEP: run this file in Supabase SQL Editor (or `supabase db push`) after review.
-- Idempotent where possible: uses IF NOT EXISTS / DROP POLICY IF EXISTS.

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name text NOT NULL,
  username text NOT NULL UNIQUE,
  employee_code text NOT NULL UNIQUE,
  role text NOT NULL CHECK (role IN ('admin', 'worker')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.inspection_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  site_name text,
  area_name text,
  shift_label text,
  instructions text,
  due_at timestamptz,
  status text NOT NULL DEFAULT 'assigned' CHECK (
    status IN (
      'draft',
      'assigned',
      'in_progress',
      'completed',
      'completed_with_issues'
    )
  ),
  created_by uuid REFERENCES auth.users (id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.inspection_task_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.inspection_tasks (id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  equipment_name text NOT NULL,
  equipment_location text,
  equipment_code text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.inspection_task_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.inspection_tasks (id) ON DELETE CASCADE,
  worker_user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES auth.users (id),
  assigned_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  execution_status text NOT NULL DEFAULT 'assigned' CHECK (
    execution_status IN (
      'assigned',
      'in_progress',
      'completed',
      'completed_with_issues'
    )
  ),
  started_at timestamptz,
  completed_at timestamptz,
  duration_minutes integer,
  last_progress_at timestamptz,
  UNIQUE (task_id, worker_user_id)
);

CREATE TABLE IF NOT EXISTS public.inspection_task_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_by uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  title text NOT NULL,
  site_name text,
  area_name text,
  description text NOT NULL,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  requested_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by uuid REFERENCES auth.users (id),
  reviewed_at timestamptz,
  admin_note text,
  approved_task_id uuid REFERENCES public.inspection_tasks (id)
);

CREATE INDEX IF NOT EXISTS idx_inspection_task_items_task_id
  ON public.inspection_task_items (task_id);

CREATE INDEX IF NOT EXISTS idx_inspection_task_assignments_task_id
  ON public.inspection_task_assignments (task_id);

CREATE INDEX IF NOT EXISTS idx_inspection_task_assignments_worker_user_id
  ON public.inspection_task_assignments (worker_user_id);

CREATE INDEX IF NOT EXISTS idx_inspection_task_requests_status
  ON public.inspection_task_requests (status);

CREATE INDEX IF NOT EXISTS idx_inspection_task_requests_requested_by
  ON public.inspection_task_requests (requested_by);

-- ---------------------------------------------------------------------------
-- RLS helpers (bypass RLS recursion via SECURITY DEFINER)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
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

GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO service_role;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_task_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_task_requests ENABLE ROW LEVEL SECURITY;

-- profiles
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid()) OR id = auth.uid()
  );

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles_insert_admin" ON public.profiles;
CREATE POLICY "profiles_insert_admin"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_update"
  ON public.profiles FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()) OR id = auth.uid())
  WITH CHECK (public.is_admin(auth.uid()) OR id = auth.uid());

-- inspection_tasks
DROP POLICY IF EXISTS "inspection_tasks_select" ON public.inspection_tasks;
CREATE POLICY "inspection_tasks_select"
  ON public.inspection_tasks FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.inspection_task_assignments a
      WHERE a.task_id = inspection_tasks.id
        AND a.worker_user_id = auth.uid()
        AND a.is_active = true
    )
  );

DROP POLICY IF EXISTS "inspection_tasks_insert_admin" ON public.inspection_tasks;
CREATE POLICY "inspection_tasks_insert_admin"
  ON public.inspection_tasks FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "inspection_tasks_update" ON public.inspection_tasks;
CREATE POLICY "inspection_tasks_update"
  ON public.inspection_tasks FOR UPDATE TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.inspection_task_assignments a
      WHERE a.task_id = inspection_tasks.id
        AND a.worker_user_id = auth.uid()
        AND a.is_active = true
    )
  )
  WITH CHECK (
    public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.inspection_task_assignments a
      WHERE a.task_id = inspection_tasks.id
        AND a.worker_user_id = auth.uid()
        AND a.is_active = true
    )
  );

DROP POLICY IF EXISTS "inspection_tasks_delete_admin" ON public.inspection_tasks;
CREATE POLICY "inspection_tasks_delete_admin"
  ON public.inspection_tasks FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- inspection_task_items
DROP POLICY IF EXISTS "inspection_task_items_select" ON public.inspection_task_items;
CREATE POLICY "inspection_task_items_select"
  ON public.inspection_task_items FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.inspection_tasks t
      WHERE t.id = inspection_task_items.task_id
        AND (
          public.is_admin(auth.uid())
          OR EXISTS (
            SELECT 1
            FROM public.inspection_task_assignments a
            WHERE a.task_id = t.id
              AND a.worker_user_id = auth.uid()
              AND a.is_active = true
          )
        )
    )
  );

DROP POLICY IF EXISTS "inspection_task_items_insert_admin" ON public.inspection_task_items;
CREATE POLICY "inspection_task_items_insert_admin"
  ON public.inspection_task_items FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "inspection_task_items_update_admin" ON public.inspection_task_items;
CREATE POLICY "inspection_task_items_update_admin"
  ON public.inspection_task_items FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "inspection_task_items_delete_admin" ON public.inspection_task_items;
CREATE POLICY "inspection_task_items_delete_admin"
  ON public.inspection_task_items FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- inspection_task_assignments
DROP POLICY IF EXISTS "inspection_task_assignments_select" ON public.inspection_task_assignments;
CREATE POLICY "inspection_task_assignments_select"
  ON public.inspection_task_assignments FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid()) OR worker_user_id = auth.uid()
  );

DROP POLICY IF EXISTS "inspection_task_assignments_insert_admin" ON public.inspection_task_assignments;
CREATE POLICY "inspection_task_assignments_insert_admin"
  ON public.inspection_task_assignments FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "inspection_task_assignments_update" ON public.inspection_task_assignments;
CREATE POLICY "inspection_task_assignments_update"
  ON public.inspection_task_assignments FOR UPDATE TO authenticated
  USING (
    public.is_admin(auth.uid()) OR worker_user_id = auth.uid()
  )
  WITH CHECK (
    public.is_admin(auth.uid()) OR worker_user_id = auth.uid()
  );

DROP POLICY IF EXISTS "inspection_task_assignments_delete_admin" ON public.inspection_task_assignments;
CREATE POLICY "inspection_task_assignments_delete_admin"
  ON public.inspection_task_assignments FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- inspection_task_requests
DROP POLICY IF EXISTS "inspection_task_requests_select" ON public.inspection_task_requests;
CREATE POLICY "inspection_task_requests_select"
  ON public.inspection_task_requests FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid()) OR requested_by = auth.uid()
  );

DROP POLICY IF EXISTS "inspection_task_requests_insert_worker" ON public.inspection_task_requests;
CREATE POLICY "inspection_task_requests_insert_worker"
  ON public.inspection_task_requests FOR INSERT TO authenticated
  WITH CHECK (requested_by = auth.uid());

DROP POLICY IF EXISTS "inspection_task_requests_update_admin" ON public.inspection_task_requests;
CREATE POLICY "inspection_task_requests_update_admin"
  ON public.inspection_task_requests FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Workers cannot approve/reject: no worker UPDATE policy above (only admin).

COMMENT ON TABLE public.profiles IS 'App users; role admin|worker. Mobile + web.';
COMMENT ON TABLE public.inspection_tasks IS 'Inspection tasks created by admin; mobile reads assigned tasks.';
COMMENT ON TABLE public.inspection_task_assignments IS 'Per-worker execution: times, duration_minutes, execution_status.';

-- ---------------------------------------------------------------------------
-- Grants (Supabase: allow authenticated role to reach tables under RLS)
-- ---------------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inspection_tasks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inspection_task_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inspection_task_assignments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inspection_task_requests TO authenticated;
