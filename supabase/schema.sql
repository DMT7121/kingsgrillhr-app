-- HR WebApp Supabase schema.sql
-- Mục tiêu: schema mẫu cho HR WebApp <= 150 nhân sự.
-- Chạy trong Supabase SQL Editor theo thứ tự: schema.sql -> seed.sql.
-- Lưu ý: đây là baseline để Antigravity/vibe code sinh app ổn định, có thể tinh chỉnh theo business thật.

create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- =========================================================
-- ENUMS
-- =========================================================
do $$ begin
  create type public.app_role as enum ('employee', 'manager', 'hr', 'admin', 'super_admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.employee_status as enum ('active', 'probation', 'on_leave', 'inactive', 'terminated');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.request_status as enum ('draft', 'pending', 'approved', 'rejected', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.attendance_status as enum ('valid', 'late', 'early_leave', 'missing_checkout', 'outside_location', 'adjusted');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payroll_status as enum ('draft', 'calculated', 'approved', 'paid', 'locked');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.candidate_status as enum ('new', 'screening', 'interview', 'offer', 'hired', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.notification_type as enum ('system', 'attendance', 'approval', 'payroll', 'chat', 'emergency', 'recruitment');
exception when duplicate_object then null; end $$;

-- =========================================================
-- HELPERS
-- =========================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.current_user_role()
returns public.app_role
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return coalesce((select role from public.profiles where id = auth.uid()), 'employee'::public.app_role);
end;
$$;

create or replace function public.is_admin_like()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return public.current_user_role() in ('hr', 'admin', 'super_admin');
end;
$$;

create or replace function public.current_employee_id()
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return (select employee_id from public.profiles where id = auth.uid());
end;
$$;

-- =========================================================
-- CORE HR
-- =========================================================
create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  address text,
  lat numeric(10,7),
  lng numeric(10,7),
  radius_meters integer default 150,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  is_deleted boolean default false
);

create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  parent_id uuid references public.departments(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  is_deleted boolean default false
);

create table if not exists public.positions (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  level integer default 1,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  is_deleted boolean default false
);

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  employee_code text unique not null,
  full_name text not null,
  email text unique,
  phone text,
  gender text,
  date_of_birth date,
  branch_id uuid references public.branches(id) on delete set null,
  department_id uuid references public.departments(id) on delete set null,
  position_id uuid references public.positions(id) on delete set null,
  manager_id uuid references public.employees(id) on delete set null,
  hire_date date default current_date,
  status public.employee_status default 'active',
  avatar_url text,
  base_salary numeric(14,2) default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  is_deleted boolean default false
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  employee_id uuid unique references public.employees(id) on delete set null,
  email text unique,
  full_name text,
  avatar_url text,
  role public.app_role default 'employee',
  status public.employee_status default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =========================================================
-- ATTENDANCE & SHIFT
-- =========================================================
create table if not exists public.work_shifts (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  start_time time not null,
  end_time time not null,
  break_minutes integer default 60,
  is_overnight boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  is_deleted boolean default false
);

create table if not exists public.shift_assignments (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  shift_id uuid not null references public.work_shifts(id) on delete restrict,
  work_date date not null,
  status public.request_status default 'approved',
  note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(employee_id, work_date)
);

create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  shift_assignment_id uuid references public.shift_assignments(id) on delete set null,
  work_date date not null,
  check_in_at timestamptz,
  check_out_at timestamptz,
  check_in_lat numeric(10,7),
  check_in_lng numeric(10,7),
  check_out_lat numeric(10,7),
  check_out_lng numeric(10,7),
  check_in_photo_url text,
  check_out_photo_url text,
  status public.attendance_status default 'valid',
  note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(employee_id, work_date)
);

create table if not exists public.attendance_adjustments (
  id uuid primary key default gen_random_uuid(),
  attendance_id uuid references public.attendance_records(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  requested_check_in_at timestamptz,
  requested_check_out_at timestamptz,
  reason text not null,
  status public.request_status default 'pending',
  approved_by uuid references public.employees(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.overtime_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  work_date date not null,
  hours numeric(5,2) not null check (hours > 0),
  reason text,
  status public.request_status default 'pending',
  approved_by uuid references public.employees(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.shift_change_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  from_shift_id uuid references public.work_shifts(id) on delete set null,
  to_shift_id uuid references public.work_shifts(id) on delete set null,
  work_date date not null,
  reason text,
  status public.request_status default 'pending',
  approved_by uuid references public.employees(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =========================================================
-- LEAVE & APPROVAL
-- =========================================================
create table if not exists public.leave_types (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  annual_quota numeric(5,2) default 0,
  is_paid boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  leave_type_id uuid not null references public.leave_types(id) on delete restrict,
  from_date date not null,
  to_date date not null,
  total_days numeric(5,2) not null,
  reason text,
  status public.request_status default 'pending',
  approved_by uuid references public.employees(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  check (to_date >= from_date)
);

create table if not exists public.approval_requests (
  id uuid primary key default gen_random_uuid(),
  request_type text not null,
  ref_table text not null,
  ref_id uuid not null,
  requester_id uuid references public.employees(id) on delete set null,
  current_approver_id uuid references public.employees(id) on delete set null,
  status public.request_status default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.approval_steps (
  id uuid primary key default gen_random_uuid(),
  approval_request_id uuid not null references public.approval_requests(id) on delete cascade,
  step_order integer not null,
  approver_id uuid references public.employees(id) on delete set null,
  status public.request_status default 'pending',
  action_note text,
  acted_at timestamptz,
  created_at timestamptz default now(),
  unique(approval_request_id, step_order)
);

-- =========================================================
-- PAYROLL & BENEFITS
-- =========================================================
create table if not exists public.payroll_periods (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  from_date date not null,
  to_date date not null,
  status public.payroll_status default 'draft',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.payroll_items (
  id uuid primary key default gen_random_uuid(),
  payroll_period_id uuid not null references public.payroll_periods(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  base_salary numeric(14,2) default 0,
  allowance numeric(14,2) default 0,
  overtime_pay numeric(14,2) default 0,
  bonus numeric(14,2) default 0,
  deduction numeric(14,2) default 0,
  insurance numeric(14,2) default 0,
  tax numeric(14,2) default 0,
  net_salary numeric(14,2) generated always as (base_salary + allowance + overtime_pay + bonus - deduction - insurance - tax) stored,
  status public.payroll_status default 'calculated',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(payroll_period_id, employee_id)
);

create table if not exists public.benefits (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  description text,
  amount numeric(14,2) default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.employee_benefits (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  benefit_id uuid not null references public.benefits(id) on delete cascade,
  start_date date default current_date,
  end_date date,
  status public.request_status default 'approved',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(employee_id, benefit_id, start_date)
);

-- =========================================================
-- PERFORMANCE & DEVELOPMENT
-- =========================================================
create table if not exists public.kpis (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  period_code text not null,
  name text not null,
  target_value numeric(12,2) default 0,
  actual_value numeric(12,2) default 0,
  unit text default '%',
  score numeric(5,2) default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.okr_objectives (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references public.employees(id) on delete cascade,
  department_id uuid references public.departments(id) on delete cascade,
  title text not null,
  description text,
  period_code text not null,
  progress numeric(5,2) default 0,
  status public.request_status default 'approved',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.okr_key_results (
  id uuid primary key default gen_random_uuid(),
  objective_id uuid not null references public.okr_objectives(id) on delete cascade,
  title text not null,
  target_value numeric(12,2) default 100,
  current_value numeric(12,2) default 0,
  unit text default '%',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.performance_reviews (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  reviewer_id uuid references public.employees(id) on delete set null,
  period_code text not null,
  score numeric(5,2) default 0,
  feedback text,
  status public.request_status default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.training_courses (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  title text not null,
  description text,
  start_date date,
  end_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.training_enrollments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.training_courses(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  progress numeric(5,2) default 0,
  completed_at timestamptz,
  status public.request_status default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(course_id, employee_id)
);

-- =========================================================
-- RECRUITMENT
-- =========================================================
create table if not exists public.recruitment_jobs (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  title text not null,
  department_id uuid references public.departments(id) on delete set null,
  position_id uuid references public.positions(id) on delete set null,
  openings integer default 1,
  status public.request_status default 'approved',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.candidates (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.recruitment_jobs(id) on delete set null,
  full_name text not null,
  email text,
  phone text,
  source text,
  resume_url text,
  status public.candidate_status default 'new',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.candidate_pipeline (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  stage public.candidate_status not null,
  note text,
  scheduled_at timestamptz,
  owner_id uuid references public.employees(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists public.interviews (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  interviewer_id uuid references public.employees(id) on delete set null,
  scheduled_at timestamptz not null,
  result text,
  note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =========================================================
-- COMMUNICATION & SYSTEM
-- =========================================================
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references public.employees(id) on delete cascade,
  type public.notification_type default 'system',
  title text not null,
  body text,
  is_read boolean default false,
  ref_table text,
  ref_id uuid,
  created_at timestamptz default now()
);

create table if not exists public.chat_rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  room_type text default 'group',
  created_by uuid references public.employees(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.chat_rooms(id) on delete cascade,
  sender_id uuid references public.employees(id) on delete set null,
  message text not null,
  attachment_url text,
  created_at timestamptz default now(),
  is_deleted boolean default false
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references public.employees(id) on delete cascade,
  title text not null,
  document_type text not null,
  file_url text not null,
  file_size_bytes bigint default 0,
  is_confidential boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.employees(id) on delete set null,
  action text not null,
  target_table text,
  target_id uuid,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  description text,
  updated_at timestamptz default now(),
  updated_by uuid references auth.users(id) on delete set null
);

-- =========================================================
-- INDEXES
-- =========================================================
create index if not exists idx_employees_department on public.employees(department_id);
create index if not exists idx_employees_manager on public.employees(manager_id);
create index if not exists idx_attendance_employee_date on public.attendance_records(employee_id, work_date desc);
create index if not exists idx_shift_assignments_employee_date on public.shift_assignments(employee_id, work_date desc);
create index if not exists idx_leave_employee_status on public.leave_requests(employee_id, status);
create index if not exists idx_payroll_employee on public.payroll_items(employee_id);
create index if not exists idx_notifications_employee_read on public.notifications(employee_id, is_read, created_at desc);
create index if not exists idx_chat_messages_room_created on public.chat_messages(room_id, created_at desc);
create index if not exists idx_activity_logs_created on public.activity_logs(created_at desc);

-- =========================================================
-- TRIGGERS: updated_at
-- =========================================================
do $$
declare t text;
begin
  foreach t in array array[
    'branches','departments','positions','employees','profiles','work_shifts','shift_assignments','attendance_records',
    'attendance_adjustments','overtime_requests','shift_change_requests','leave_types','leave_requests','approval_requests',
    'payroll_periods','payroll_items','benefits','employee_benefits','kpis','okr_objectives','okr_key_results',
    'performance_reviews','training_courses','training_enrollments','recruitment_jobs','candidates','interviews',
    'chat_rooms','documents','app_settings'
  ] loop
    execute format('drop trigger if exists trg_%I_updated_at on public.%I', t, t);
    execute format('create trigger trg_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()', t, t);
  end loop;
end $$;

-- =========================================================
-- RLS ENABLE
-- =========================================================
do $$
declare t text;
begin
  foreach t in array array[
    'branches','departments','positions','employees','profiles','work_shifts','shift_assignments','attendance_records',
    'attendance_adjustments','overtime_requests','shift_change_requests','leave_types','leave_requests','approval_requests','approval_steps',
    'payroll_periods','payroll_items','benefits','employee_benefits','kpis','okr_objectives','okr_key_results',
    'performance_reviews','training_courses','training_enrollments','recruitment_jobs','candidates','candidate_pipeline','interviews',
    'notifications','chat_rooms','chat_messages','documents','activity_logs','app_settings'
  ] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- =========================================================
-- BASIC RLS POLICIES
-- Supabase chỉ cho phép tạo policy nếu chưa tồn tại bằng DO block.
-- Quy tắc baseline:
-- - HR/Admin/Super Admin xem/sửa dữ liệu nghiệp vụ.
-- - Employee xem dữ liệu cá nhân của mình.
-- - Manager xem một số dữ liệu của nhân viên trực tiếp.
-- =========================================================

do $$ begin
  create policy "profiles_select_own_or_admin" on public.profiles
    for select using (id = auth.uid() or public.is_admin_like());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "profiles_update_own_basic" on public.profiles
    for update using (id = auth.uid() or public.is_admin_like())
    with check (id = auth.uid() or public.is_admin_like());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "employees_select_scope" on public.employees
    for select using (
      public.is_admin_like()
      or id = public.current_employee_id()
      or manager_id = public.current_employee_id()
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "employees_write_admin" on public.employees
    for all using (public.is_admin_like()) with check (public.is_admin_like());
exception when duplicate_object then null; end $$;

-- Reference/master data readable by authenticated users; writable by HR/Admin.
do $$ begin
  create policy "master_data_read_authenticated" on public.branches for select using (auth.role() = 'authenticated');
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "master_data_write_admin_branches" on public.branches for all using (public.is_admin_like()) with check (public.is_admin_like());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "departments_read_authenticated" on public.departments for select using (auth.role() = 'authenticated');
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "departments_write_admin" on public.departments for all using (public.is_admin_like()) with check (public.is_admin_like());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "positions_read_authenticated" on public.positions for select using (auth.role() = 'authenticated');
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "positions_write_admin" on public.positions for all using (public.is_admin_like()) with check (public.is_admin_like());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "work_shifts_read_authenticated" on public.work_shifts for select using (auth.role() = 'authenticated');
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "work_shifts_write_admin" on public.work_shifts for all using (public.is_admin_like()) with check (public.is_admin_like());
exception when duplicate_object then null; end $$;

-- Employee scoped tables.
do $$ begin
  create policy "attendance_select_scope" on public.attendance_records
    for select using (public.is_admin_like() or employee_id = public.current_employee_id() or exists(select 1 from public.employees e where e.id = attendance_records.employee_id and e.manager_id = public.current_employee_id()));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "attendance_insert_own_or_admin" on public.attendance_records
    for insert with check (public.is_admin_like() or employee_id = public.current_employee_id());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "attendance_update_admin" on public.attendance_records
    for update using (public.is_admin_like()) with check (public.is_admin_like());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "shift_assignments_select_scope" on public.shift_assignments
    for select using (public.is_admin_like() or employee_id = public.current_employee_id() or exists(select 1 from public.employees e where e.id = shift_assignments.employee_id and e.manager_id = public.current_employee_id()));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "shift_assignments_write_admin" on public.shift_assignments for all using (public.is_admin_like()) with check (public.is_admin_like());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "leave_requests_select_scope" on public.leave_requests
    for select using (public.is_admin_like() or employee_id = public.current_employee_id() or exists(select 1 from public.employees e where e.id = leave_requests.employee_id and e.manager_id = public.current_employee_id()));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "leave_requests_insert_own" on public.leave_requests
    for insert with check (employee_id = public.current_employee_id() or public.is_admin_like());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "leave_requests_update_approver" on public.leave_requests
    for update using (public.is_admin_like() or exists(select 1 from public.employees e where e.id = leave_requests.employee_id and e.manager_id = public.current_employee_id()))
    with check (public.is_admin_like() or exists(select 1 from public.employees e where e.id = leave_requests.employee_id and e.manager_id = public.current_employee_id()));
exception when duplicate_object then null; end $$;

-- Payroll: employee sees own payslip; HR/Admin sees all.
do $$ begin
  create policy "payroll_items_select_scope" on public.payroll_items
    for select using (public.is_admin_like() or employee_id = public.current_employee_id());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "payroll_items_write_admin" on public.payroll_items for all using (public.is_admin_like()) with check (public.is_admin_like());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "payroll_periods_read_auth" on public.payroll_periods for select using (auth.role() = 'authenticated');
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "payroll_periods_write_admin" on public.payroll_periods for all using (public.is_admin_like()) with check (public.is_admin_like());
exception when duplicate_object then null; end $$;

-- Performance: employee own + manager direct + admin.
do $$ begin
  create policy "kpis_select_scope" on public.kpis
    for select using (public.is_admin_like() or employee_id = public.current_employee_id() or exists(select 1 from public.employees e where e.id = kpis.employee_id and e.manager_id = public.current_employee_id()));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "kpis_write_manager_admin" on public.kpis
    for all using (public.is_admin_like() or exists(select 1 from public.employees e where e.id = kpis.employee_id and e.manager_id = public.current_employee_id()))
    with check (public.is_admin_like() or exists(select 1 from public.employees e where e.id = kpis.employee_id and e.manager_id = public.current_employee_id()));
exception when duplicate_object then null; end $$;

-- Documents: employee own; confidential management by HR/Admin.
do $$ begin
  create policy "documents_select_scope" on public.documents
    for select using (public.is_admin_like() or employee_id = public.current_employee_id());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "documents_write_admin" on public.documents for all using (public.is_admin_like()) with check (public.is_admin_like());
exception when duplicate_object then null; end $$;

-- Notifications and chat.
do $$ begin
  create policy "notifications_select_own" on public.notifications
    for select using (public.is_admin_like() or employee_id = public.current_employee_id());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "notifications_update_own_read" on public.notifications
    for update using (employee_id = public.current_employee_id() or public.is_admin_like())
    with check (employee_id = public.current_employee_id() or public.is_admin_like());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "notifications_insert_admin" on public.notifications for insert with check (public.is_admin_like());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "chat_rooms_read_auth" on public.chat_rooms for select using (auth.role() = 'authenticated');
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "chat_messages_read_auth" on public.chat_messages for select using (auth.role() = 'authenticated');
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "chat_messages_insert_auth" on public.chat_messages for insert with check (sender_id = public.current_employee_id() or public.is_admin_like());
exception when duplicate_object then null; end $$;

-- Recruitment and system tables: HR/Admin.
do $$ begin
  create policy "recruitment_read_admin" on public.recruitment_jobs for select using (public.is_admin_like());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "recruitment_write_admin" on public.recruitment_jobs for all using (public.is_admin_like()) with check (public.is_admin_like());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "candidates_admin" on public.candidates for all using (public.is_admin_like()) with check (public.is_admin_like());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "candidate_pipeline_admin" on public.candidate_pipeline for all using (public.is_admin_like()) with check (public.is_admin_like());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "interviews_admin" on public.interviews for all using (public.is_admin_like()) with check (public.is_admin_like());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "activity_logs_admin" on public.activity_logs for select using (public.is_admin_like());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "activity_logs_insert_auth" on public.activity_logs for insert with check (auth.role() = 'authenticated');
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "app_settings_admin" on public.app_settings for all using (public.is_admin_like()) with check (public.is_admin_like());
exception when duplicate_object then null; end $$;

-- Fallback admin policies for remaining similar tables.
do $$ begin
  create policy "approval_requests_scope" on public.approval_requests for select using (public.is_admin_like() or requester_id = public.current_employee_id() or current_approver_id = public.current_employee_id());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "approval_requests_write_admin_manager" on public.approval_requests for all using (public.is_admin_like() or current_approver_id = public.current_employee_id() or requester_id = public.current_employee_id()) with check (public.is_admin_like() or requester_id = public.current_employee_id());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "approval_steps_scope" on public.approval_steps for select using (public.is_admin_like() or approver_id = public.current_employee_id());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "approval_steps_write_admin" on public.approval_steps for all using (public.is_admin_like()) with check (public.is_admin_like());
exception when duplicate_object then null; end $$;

-- NOTE Storage bucket policies cần cấu hình trong Supabase Storage UI hoặc SQL riêng.
-- Đề xuất bucket: avatars, documents, attendance-photos, candidate-resumes.
