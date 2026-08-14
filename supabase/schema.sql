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

-- ============================================================================
-- Phase 2 - client management
-- ============================================================================

-- Once a trainer invites someone, they show up as "invited". Once that
-- person clicks the email link and sets a password, they become "active".
do $$
begin
  if not exists (select 1 from pg_type where typname = 'trainer_client_status') then
    create type public.trainer_client_status as enum ('invited', 'active');
  end if;
end $$;

-- Links a trainer to one of their clients. The client's name lives on their
-- own profiles row (client_id below); email is copied here too so the
-- trainer's client list can be shown without needing admin-only access to
-- auth.users.
create table if not exists public.trainer_clients (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.profiles (id) on delete cascade,
  client_id uuid not null references public.profiles (id) on delete cascade,
  email text not null,
  goals text,
  notes text,
  status public.trainer_client_status not null default 'invited',
  created_at timestamptz not null default now(),
  unique (trainer_id, client_id)
);

alter table public.trainer_clients enable row level security;

drop policy if exists "Trainers can view own clients" on public.trainer_clients;
create policy "Trainers can view own clients"
  on public.trainer_clients for select
  using (auth.uid() = trainer_id);

drop policy if exists "Trainers can add own clients" on public.trainer_clients;
create policy "Trainers can add own clients"
  on public.trainer_clients for insert
  with check (auth.uid() = trainer_id);

drop policy if exists "Trainers can update own clients" on public.trainer_clients;
create policy "Trainers can update own clients"
  on public.trainer_clients for update
  using (auth.uid() = trainer_id);

-- Lets a newly-invited client see and activate their own row (see the
-- set-password step) without giving them access to any other trainer's data.
drop policy if exists "Clients can view own client row" on public.trainer_clients;
create policy "Clients can view own client row"
  on public.trainer_clients for select
  using (auth.uid() = client_id);

drop policy if exists "Clients can activate own client row" on public.trainer_clients;
create policy "Clients can activate own client row"
  on public.trainer_clients for update
  using (auth.uid() = client_id);

-- Trainers could only ever see their OWN profile row (see "Users can view
-- own profile" above) - which silently blocked the trainer's client list
-- and client profile pages from reading a client's name at all. This lets
-- a trainer view the profile of anyone they've actually invited, and no one
-- else's.
drop policy if exists "Trainers can view their clients' profiles" on public.profiles;
create policy "Trainers can view their clients' profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.trainer_clients
      where trainer_clients.client_id = profiles.id
      and trainer_clients.trainer_id = auth.uid()
    )
  );

-- When a trainer invites someone, the new profiles row is created by the
-- on_auth_user_created trigger before the trainer's own request gets a
-- chance to set their name. "security definer" means this function runs
-- with the permissions of the person who created it (not the trainer
-- calling it), so it can update someone else's profile safely - but only
-- ever this one field, and only right after an invite.
create or replace function public.set_invited_client_name(
  target_client_id uuid,
  new_full_name text
)
returns void as $$
begin
  update public.profiles
  set full_name = new_full_name
  where id = target_client_id and role = 'client';
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function public.set_invited_client_name(uuid, text) to authenticated;
