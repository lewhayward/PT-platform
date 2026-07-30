-- ============================================================================
-- PT Platform - Phase 1 database schema
--
-- HOW TO RUN THIS:
-- 1. Open your project at https://supabase.com/dashboard
-- 2. Go to the "SQL Editor" tab in the left sidebar
-- 3. Paste this whole file in and click "Run"
--
-- It is safe to re-run: every statement below either creates something only
-- if it doesn't already exist, or replaces it.
-- ============================================================================

-- A person is either a trainer or a client. Stored as a proper Postgres
-- enum so the database itself rejects any other value.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('trainer', 'client');
  end if;
end $$;

-- One row per signed-up person. Supabase Auth already stores the email and
-- password securely in its own internal "auth.users" table - this table
-- holds the extra info our app needs (role, display name).
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'client',
  full_name text,
  created_at timestamptz not null default now()
);

-- Row Level Security: turns on Supabase's per-row access rules. Without
-- this, any signed-in user could read or edit every profile in the table.
alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Stop a signed-in user from promoting themselves by editing their own row
-- (e.g. changing "client" to "trainer" via the API). Role is only ever set
-- once, at sign-up, by the trigger below.
create or replace function public.prevent_role_change()
returns trigger as $$
begin
  new.role := old.role;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists prevent_role_change_trigger on public.profiles;
create trigger prevent_role_change_trigger
  before update on public.profiles
  for each row execute function public.prevent_role_change();

-- When someone signs up, Supabase Auth creates a row in its internal
-- "auth.users" table. This function copies the role and name they chose on
-- the sign-up form (passed in as "metadata") into our profiles table.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'client'),
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
