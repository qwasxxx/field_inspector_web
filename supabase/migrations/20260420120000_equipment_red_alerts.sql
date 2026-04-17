-- Красные тревоги по оборудованию: мобильное приложение → админ-панель.
-- MANUAL: применить в Supabase SQL Editor или `supabase db push`.
-- Требуется public.is_admin(uuid) из предыдущих миграций.

CREATE TABLE IF NOT EXISTS public.equipment_red_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id text NOT NULL,
  equipment_name text,
  site_name text,
  area_name text,
  task_id uuid REFERENCES public.inspection_tasks (id) ON DELETE SET NULL,
  triggered_by uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  triggered_by_name text,
  source text NOT NULL DEFAULT 'mobile',
  severity text NOT NULL DEFAULT 'critical' CHECK (
    severity IN ('critical', 'high', 'medium', 'low')
  ),
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'open' CHECK (
    status IN ('open', 'acknowledged', 'resolved', 'dismissed')
  ),
  acknowledged_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  acknowledged_at timestamptz,
  resolved_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_equipment_red_alerts_status_created
  ON public.equipment_red_alerts (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_equipment_red_alerts_task_id
  ON public.equipment_red_alerts (task_id);

CREATE INDEX IF NOT EXISTS idx_equipment_red_alerts_severity
  ON public.equipment_red_alerts (severity);

CREATE OR REPLACE FUNCTION public.equipment_red_alerts_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS equipment_red_alerts_updated_at ON public.equipment_red_alerts;
CREATE TRIGGER equipment_red_alerts_updated_at
  BEFORE UPDATE ON public.equipment_red_alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.equipment_red_alerts_touch_updated_at();

ALTER TABLE public.equipment_red_alerts ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.equipment_red_alerts TO authenticated;

DROP POLICY IF EXISTS "equipment_red_alerts_select" ON public.equipment_red_alerts;
CREATE POLICY "equipment_red_alerts_select"
  ON public.equipment_red_alerts FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR triggered_by = auth.uid()
  );

DROP POLICY IF EXISTS "equipment_red_alerts_insert" ON public.equipment_red_alerts;
CREATE POLICY "equipment_red_alerts_insert"
  ON public.equipment_red_alerts FOR INSERT TO authenticated
  WITH CHECK (triggered_by = auth.uid());

DROP POLICY IF EXISTS "equipment_red_alerts_update_admin" ON public.equipment_red_alerts;
CREATE POLICY "equipment_red_alerts_update_admin"
  ON public.equipment_red_alerts FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "equipment_red_alerts_delete_admin" ON public.equipment_red_alerts;
CREATE POLICY "equipment_red_alerts_delete_admin"
  ON public.equipment_red_alerts FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.equipment_red_alerts;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
