# Database setup: shared task & worker workflow (Supabase)

This document describes the **SQL migration added in-repo** for the admin panel + mobile worker task system. It does **not** modify existing tables: `inspection_reports`, `inspection_media`, `inspector_ping`.

## 1. What was created

- **`profiles`** — one row per auth user; `role` is `'admin'` or `'worker'`.
- **`inspection_tasks`** — tasks created by admins (title, site, area, shift, instructions, due date, lifecycle `status`).
- **`inspection_task_items`** — route / equipment rows per task (`sort_order`, names, location, code).
- **`inspection_task_assignments`** — which worker is assigned to which task; execution tracking (`execution_status`, `started_at`, `completed_at`, `duration_minutes`, `last_progress_at`).
- **`inspection_task_requests`** — worker-submitted requests; admin reviews (`status`, `reviewed_by`, `approved_task_id`, etc.).

Indexes, **RLS enabled** on all of the above, **policies** for admin vs worker, and helper **`public.is_task_admin()`** (security definer) for role checks.

**Extra policy (required by the mobile app):** workers with an **active** assignment may **`UPDATE` `inspection_tasks`** so the app can set `status` to `in_progress` / `completed` / `completed_with_issues` (see `AssignedInspectionTaskService`). RLS does not restrict which columns are updated; tighten later with triggers if needed.

## 2. Where the migration file is

| Path |
|------|
| `supabase/migrations/20260416143000_task_system_shared_schema.sql` |

## 3. Can this repo apply the migration automatically?

**No.** This Flutter project **does not** ship Supabase CLI config, CI migration steps, or a script that pushes SQL to your hosted project. The file is **prepared in-repo only**.

You (or your admin app pipeline) must apply it using one of:

- **Supabase Dashboard → SQL Editor** (paste and run the file), or
- **Supabase CLI** (`supabase link` + `supabase db push`), if you choose to adopt CLI for this repo later.

## 4. Exact SQL to run manually (Supabase SQL Editor)

1. Open **Supabase Dashboard** → **SQL Editor** → New query.
2. Paste the **full contents** of:

   `supabase/migrations/20260416143000_task_system_shared_schema.sql`

3. Run the script **once**.

If any statement fails (e.g. **`profiles` already exists** with a different shape), stop, resolve the conflict (rename/drop dev-only table or adjust columns manually), then rerun or edit the script. This migration assumes these five tables **do not** already exist.

## 5. Data you must still create manually

The migration does **not** create auth users or seed tasks.

**Minimum bootstrap:**

1. **Auth users** — Create users in **Authentication** (or sign up from the app).
2. **`profiles` rows** — For each user, insert a row with matching `id` (`uuid` = `auth.users.id`):
   - At least one **`role = 'admin'`** user so policies can manage tasks and assignments.
   - Workers: **`role = 'worker'`**, `full_name`, optional `username` / `employee_code` (unique when not null).
3. **Tasks** — Insert into `inspection_tasks` (as admin via app or `service_role` / SQL).
4. **Route items** — Insert into `inspection_task_items` for each task.
5. **Assignments** — Insert into `inspection_task_assignments` (`worker_user_id`, `task_id`, `is_active = true`, etc.).

**Optional example SQL** (replace UUIDs with real `auth.users` ids from your project):

```sql
-- Example admin profile (id must exist in auth.users)
insert into public.profiles (id, full_name, username, employee_code, role, is_active)
values (
  '00000000-0000-0000-0000-000000000001',
  'Admin User',
  'admin',
  'ADM-001',
  'admin',
  true
);

-- Example worker profile
insert into public.profiles (id, full_name, username, employee_code, role, is_active)
values (
  '00000000-0000-0000-0000-000000000002',
  'Field Worker',
  'worker1',
  'EMP-1001',
  'worker',
  true
);

-- Example task + item + assignment (use real task/worker ids)
-- insert into public.inspection_tasks (id, title, site_name, area_name, status) ...
-- insert into public.inspection_task_items (task_id, sort_order, equipment_name) ...
-- insert into public.inspection_task_assignments (task_id, worker_user_id, is_active) ...
```

**Mobile dev fallback:** If you use `AppEnv.devWorkerUserId`, that UUID must exist in **`auth.users`** and **`profiles`** (as `worker`) and have assignments, or list/load queries will return empty / fail RLS expectations.

## 6. How mobile and admin use these tables

| Flow | Tables |
|------|--------|
| Worker identity & profile UI | `profiles` (read own row); mobile uses `auth` + optional dev UUID |
| Task list for worker | `inspection_task_assignments` (`worker_user_id`, `is_active`) + `inspection_tasks` + `inspection_task_items` |
| Start route / progress / complete | Updates to `inspection_task_assignments` + `inspection_tasks.status` (mobile) |
| Inspection report / media | Unchanged: still **`inspection_reports`** / **`inspection_media`** with `task_id` / `equipment_id` matching **`inspection_tasks.id`** and **`inspection_task_items.id`** for real assignments |
| Worker “request a task” | `INSERT` into `inspection_task_requests` (`requested_by`, `status = 'pending'`) |
| Admin approval UI | `SELECT` / `UPDATE` `inspection_task_requests`; create `inspection_tasks` + assignment when approved (app-specific) |

**Roles:** Policies treat **`profiles.role = 'admin'`** (and `is_active`) as admin. **`service_role`** bypasses RLS for server-side admin tools.

## 7. Preserved tables

This migration **does not** `DROP` or `ALTER` **`inspection_reports`**, **`inspection_media`**, or **`inspector_ping`**. Existing report/media save logic in the app is unchanged by this file.

---

## Summary

| Item | Status |
|------|--------|
| Migration SQL in repo | Yes — path above |
| Auto-applied from this Flutter repo | **No** |
| Your action | Run the SQL in Supabase (Editor or CLI) once; then seed users/profiles/tasks/assignments |
