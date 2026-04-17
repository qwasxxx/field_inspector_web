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

export type TaskChatThreadRow = {
  id?: string;
  task_id?: string | null;
  created_by?: string | null;
  created_at?: string | null;
  last_message_at?: string | null;
  last_message_preview?: string | null;
  [key: string]: unknown;
};

export type TaskChatMessageRow = {
  id?: string;
  thread_id?: string | null;
  task_id?: string | null;
  sender_user_id?: string | null;
  sender_role?: string | null;
  /** Текст сообщения в актуальной схеме Supabase (как у мобильного клиента). */
  content?: string | null;
  /** Устаревшее имя в старых миграциях; чтение поддерживается через getTaskChatMessageText. */
  body?: string | null;
  body_text?: string | null;
  message_type?: string | null;
  created_at?: string | null;
  [key: string]: unknown;
};

export type TaskChatAttachmentRow = {
  id?: string;
  message_id?: string | null;
  storage_path?: string | null;
  storage_bucket?: string | null;
  /** Если мобильное клиент заполняет другой ключ пути — поддерживается в getAttachmentStoragePath */
  file_path?: string | null;
  file_name?: string | null;
  mime_type?: string | null;
  size_bytes?: number | null;
  created_at?: string | null;
  [key: string]: unknown;
};

export type TaskChatReadRow = {
  thread_id?: string;
  user_id?: string;
  last_read_at?: string | null;
  [key: string]: unknown;
};

export type EquipmentRedAlertRow = {
  id?: string;
  equipment_id?: string | null;
  equipment_name?: string | null;
  site_name?: string | null;
  area_name?: string | null;
  task_id?: string | null;
  triggered_by?: string | null;
  triggered_by_name?: string | null;
  source?: string | null;
  severity?: string | null;
  title?: string | null;
  description?: string | null;
  status?: string | null;
  acknowledged_by?: string | null;
  acknowledged_at?: string | null;
  resolved_by?: string | null;
  resolved_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: unknown;
};
