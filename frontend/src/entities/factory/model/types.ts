/**
 * Допустимые формы строк из Supabase без жёсткой привязки к схеме (backend может отличаться).
 */

export type ProfileRow = {
  id?: string;
  full_name?: string | null;
  username?: string | null;
  employee_code?: string | null;
  role?: string | null;
  is_active?: boolean | null;
  [key: string]: unknown;
};

export type InspectionTaskRow = {
  id?: string;
  title?: string | null;
  site_name?: string | null;
  area_name?: string | null;
  status?: string | null;
  due_at?: string | null;
  shift_label?: string | null;
  instructions?: string | null;
  created_by?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  duration_minutes?: number | null;
  execution_status?: string | null;
  [key: string]: unknown;
};

export type InspectionTaskItemRow = {
  id?: string;
  task_id?: string | null;
  /** @deprecated используйте task_id (совпадает с public.inspection_task_items.task_id) */
  inspection_task_id?: string | null;
  sort_order?: number | null;
  equipment_name?: string | null;
  equipment_location?: string | null;
  equipment_code?: string | null;
  [key: string]: unknown;
};

export type InspectionTaskAssignmentRow = {
  id?: string;
  task_id?: string | null;
  worker_user_id?: string | null;
  assigned_by?: string | null;
  assigned_at?: string | null;
  is_active?: boolean | null;
  execution_status?: string | null;
  /** @deprecated используйте task_id */
  inspection_task_id?: string | null;
  /** @deprecated используйте worker_user_id */
  worker_id?: string | null;
  profile_id?: string | null;
  [key: string]: unknown;
};

export type TaskRequestRow = {
  id?: string;
  title?: string | null;
  requested_by?: string | null;
  site_name?: string | null;
  area_name?: string | null;
  description?: string | null;
  priority?: string | null;
  status?: string | null;
  requested_at?: string | null;
  [key: string]: unknown;
};

export type SupabaseResult<T> = {
  data: T;
  error: string | null;
};
