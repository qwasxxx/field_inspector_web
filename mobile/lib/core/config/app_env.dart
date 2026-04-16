class AppEnv {
  AppEnv._();

  /// Same values as SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY (Dashboard → Settings → API).
  static const String supabaseUrl = 'https://dwghdzghehkwlsxwiobc.supabase.co';
  static const String supabaseAnonKey =
      'sb_publishable_X8ToyYF5sjaqI0YJHYWGnA_FqRpHWPw';
  static const String inspectionMediaBucket = 'inspection-media';

  /// When [inspection_reports] enforces FK on `task_id` / `equipment_id`, set these
  /// to real UUID strings that already exist in your database. Leave empty to use
  /// route-derived ids from the app.
  static const String inspectionReportTaskIdOverride = '';
  static const String inspectionReportEquipmentIdOverride = '';

  /// Development only: UUID of `profiles.id` / auth user id used in
  /// `inspection_task_assignments.worker_user_id`. Conceptually the same as a
  /// `DEV_WORKER_USER_ID` env override. Leave empty in production builds.
  static const String devWorkerUserId = '';
}
