-- Shared schema: worker profiles, tasks, route items, assignments, worker requests.
-- Safe to run once on a project that already has inspection_reports / inspection_media / inspector_ping
-- (this migration does not alter those tables).
--
-- Apply via Supabase SQL Editor or: supabase db push (if you link this folder with Supabase CLI).

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  username text unique,
  employee_code text unique,
  role text not null check (role in ('admin', 'worker')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.inspection_tasks (
  id uuid primary key default gen_random_uuid (),
  title text not null,
  site_name text,
  area_name text,
  shift_label text,
  instructions text,
  due_at timestamptz,
  status text not null default 'assigned' check (
    status in (
      'draft',
      'assigned',
      'in_progress',
      'completed',
      'completed_with_issues'
    )
  ),
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create table public.inspection_task_items (
  id uuid primary key default gen_random_uuid (),
  task_id uuid not null references public.inspection_tasks (id) on delete cascade,
  sort_order integer not null default 0,
  equipment_name text not null,
  equipment_location text,
  equipment_code text,
  created_at timestamptz not null default now()
);

create table public.inspection_task_assignments (
  id uuid primary key default gen_random_uuid (),
  task_id uuid not null references public.inspection_tasks (id) on delete cascade,
  worker_user_id uuid not null references auth.users (id) on delete cascade,
  assigned_by uuid references auth.users (id),
  assigned_at timestamptz not null default now(),
  is_active boolean not null default true,
  execution_status text not null default 'assigned' check (
    execution_status in (
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
  unique (task_id, worker_user_id)
);

create table public.inspection_task_requests (
  id uuid primary key default gen_random_uuid (),
  requested_by uuid not null references auth.users (id) on delete cascade,
  title text not null,
  site_name text,
  area_name text,
  description text not null,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  requested_at timestamptz not null default now(),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references auth.users (id),
  reviewed_at timestamptz,
  admin_note text,
  approved_task_id uuid references public.inspection_tasks (id)
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index if not exists inspection_task_assignments_worker_active_idx
  on public.inspection_task_assignments (worker_user_id, is_active);

create index if not exists inspection_task_items_task_sort_idx
  on public.inspection_task_items (task_id, sort_order);

create index if not exists inspection_task_requests_status_requested_idx
  on public.inspection_task_requests (status, requested_at desc);

create index if not exists inspection_tasks_status_created_idx
  on public.inspection_tasks (status, created_at desc);

-- ---------------------------------------------------------------------------
-- Admin helper (avoids RLS recursion when checking role)
-- ---------------------------------------------------------------------------

create or replace function public.is_task_admin ()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid ()
      and p.role = 'admin'
      and p.is_active = true
  );
$$;

revoke all on function public.is_task_admin () from public;
grant execute on function public.is_task_admin () to authenticated;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.inspection_tasks enable row level security;
alter table public.inspection_task_items enable row level security;
alter table public.inspection_task_assignments enable row level security;
alter table public.inspection_task_requests enable row level security;

-- profiles
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (id = auth.uid () or public.is_task_admin ());

create policy "profiles_insert_admin"
  on public.profiles for insert
  with check (public.is_task_admin ());

create policy "profiles_update_admin"
  on public.profiles for update
  using (public.is_task_admin ())
  with check (public.is_task_admin ());

-- inspection_tasks (admin CRUD subset; worker read + status sync for assigned tasks)
create policy "inspection_tasks_select_admin"
  on public.inspection_tasks for select
  using (public.is_task_admin ());

create policy "inspection_tasks_select_worker_assigned"
  on public.inspection_tasks for select
  using (
    exists (
      select 1
      from public.inspection_task_assignments a
      where a.task_id = inspection_tasks.id
        and a.worker_user_id = auth.uid ()
        and a.is_active = true
    )
  );

create policy "inspection_tasks_insert_admin"
  on public.inspection_tasks for insert
  with check (public.is_task_admin ());

create policy "inspection_tasks_update_admin"
  on public.inspection_tasks for update
  using (public.is_task_admin ())
  with check (public.is_task_admin ());

-- Mobile app updates task lifecycle status when worker progresses (see AssignedInspectionTaskService).
create policy "inspection_tasks_update_worker_assigned"
  on public.inspection_tasks for update
  using (
    exists (
      select 1
      from public.inspection_task_assignments a
      where a.task_id = inspection_tasks.id
        and a.worker_user_id = auth.uid ()
        and a.is_active = true
    )
  )
  with check (
    exists (
      select 1
      from public.inspection_task_assignments a
      where a.task_id = inspection_tasks.id
        and a.worker_user_id = auth.uid ()
        and a.is_active = true
    )
  );

-- inspection_task_items
create policy "inspection_task_items_select_admin"
  on public.inspection_task_items for select
  using (public.is_task_admin ());

create policy "inspection_task_items_select_worker_assigned"
  on public.inspection_task_items for select
  using (
    exists (
      select 1
      from public.inspection_task_assignments a
      where a.task_id = inspection_task_items.task_id
        and a.worker_user_id = auth.uid ()
        and a.is_active = true
    )
  );

create policy "inspection_task_items_insert_admin"
  on public.inspection_task_items for insert
  with check (public.is_task_admin ());

create policy "inspection_task_items_update_admin"
  on public.inspection_task_items for update
  using (public.is_task_admin ())
  with check (public.is_task_admin ());

-- inspection_task_assignments
create policy "inspection_task_assignments_select_admin"
  on public.inspection_task_assignments for select
  using (public.is_task_admin ());

create policy "inspection_task_assignments_select_worker_own"
  on public.inspection_task_assignments for select
  using (worker_user_id = auth.uid ());

create policy "inspection_task_assignments_insert_admin"
  on public.inspection_task_assignments for insert
  with check (public.is_task_admin ());

create policy "inspection_task_assignments_update_admin"
  on public.inspection_task_assignments for update
  using (public.is_task_admin ())
  with check (public.is_task_admin ());

create policy "inspection_task_assignments_update_worker_own"
  on public.inspection_task_assignments for update
  using (worker_user_id = auth.uid ())
  with check (worker_user_id = auth.uid ());

-- inspection_task_requests
create policy "inspection_task_requests_select_admin"
  on public.inspection_task_requests for select
  using (public.is_task_admin ());

create policy "inspection_task_requests_select_worker_own"
  on public.inspection_task_requests for select
  using (requested_by = auth.uid ());

create policy "inspection_task_requests_insert_worker_own"
  on public.inspection_task_requests for insert
  with check (requested_by = auth.uid ());

create policy "inspection_task_requests_update_admin"
  on public.inspection_task_requests for update
  using (public.is_task_admin ())
  with check (public.is_task_admin ());

-- ---------------------------------------------------------------------------
-- Grants (Supabase: authenticated clients use these tables via RLS)
-- ---------------------------------------------------------------------------

grant select, insert, update on table public.profiles to authenticated;
grant select, insert, update on table public.inspection_tasks to authenticated;
grant select, insert, update on table public.inspection_task_items to authenticated;
grant select, insert, update on table public.inspection_task_assignments to authenticated;
grant select, insert, update on table public.inspection_task_requests to authenticated;
