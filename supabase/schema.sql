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

-- Requires the caller to actually be a trainer, not just anyone signed in -
-- without the role check, any authenticated user could insert a row naming
-- themselves as trainer_id and any other profile as client_id, gaining read
-- access to that person's data wherever a policy trusts this table (e.g.
-- food_logs and nutrition_targets below).
drop policy if exists "Trainers can add own clients" on public.trainer_clients;
create policy "Trainers can add own clients"
  on public.trainer_clients for insert
  with check (
    auth.uid() = trainer_id
    and exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'trainer'
    )
    -- Also requires the named client_id to actually be a client-role
    -- profile - otherwise one trainer could name a second trainer as their
    -- "client", and that second trainer's own client-view policy on this
    -- table would then let them see the (fabricated) relationship row.
    and exists (
      select 1 from public.profiles
      where profiles.id = trainer_clients.client_id and profiles.role = 'client'
    )
  );

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
-- ever this one field, only for someone who is actually their own client,
-- and only right after an invite.
create or replace function public.set_invited_client_name(
  target_client_id uuid,
  new_full_name text
)
returns void as $$
begin
  update public.profiles
  set full_name = new_full_name
  where id = target_client_id
    and role = 'client'
    and exists (
      select 1 from public.trainer_clients
      where trainer_clients.client_id = target_client_id
      and trainer_clients.trainer_id = auth.uid()
    );
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function public.set_invited_client_name(uuid, text) to authenticated;

-- ============================================================================
-- Phase 3 - workout programming
-- ============================================================================

-- Captured on the "Add client" form. Used to suggest a matching starter
-- programme (see programme_templates below) - the free-text goals/notes
-- fields already on trainer_clients are for qualitative detail; these two
-- are structured so they can be matched against.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'client_goal') then
    create type public.client_goal as enum ('bodybuilding', 'fat_loss', 'general_fitness', 'strength');
  end if;
end $$;

alter table public.trainer_clients add column if not exists goal public.client_goal;
alter table public.trainer_clients add column if not exists days_per_week smallint check (days_per_week between 1 and 7);

do $$
begin
  if not exists (select 1 from pg_type where typname = 'muscle_group') then
    create type public.muscle_group as enum ('chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'cardio', 'full_body');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'day_of_week') then
    create type public.day_of_week as enum ('mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun');
  end if;
end $$;

-- The exercise library. Shared reference data (not owned by any one
-- trainer) that everyone signed in can browse when building a workout.
create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  muscle_group public.muscle_group not null,
  equipment text,
  created_at timestamptz not null default now()
);

alter table public.exercises enable row level security;

drop policy if exists "Anyone signed in can view exercises" on public.exercises;
create policy "Anyone signed in can view exercises"
  on public.exercises for select
  to authenticated
  using (true);

-- A reusable single-day workout (e.g. "Push Day A"). Either a trainer's own
-- saved template (trainer_id set - built from a day they've already put
-- together and chosen to save, see the app's "Save as template" action), or
-- a starter template we ship with the app (trainer_id null).
create table if not exists public.workout_templates (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid references public.profiles (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists workout_templates_starter_name_idx
  on public.workout_templates (name)
  where trainer_id is null;

alter table public.workout_templates enable row level security;

drop policy if exists "Trainers can view own or starter templates" on public.workout_templates;
create policy "Trainers can view own or starter templates"
  on public.workout_templates for select
  to authenticated
  using (auth.uid() = trainer_id or trainer_id is null);

drop policy if exists "Trainers can manage own templates" on public.workout_templates;
create policy "Trainers can manage own templates"
  on public.workout_templates for all
  using (auth.uid() = trainer_id)
  with check (auth.uid() = trainer_id);

create table if not exists public.workout_template_exercises (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.workout_templates (id) on delete cascade,
  exercise_id uuid references public.exercises (id),
  custom_name text,
  sets smallint not null,
  reps text not null,
  weight text,
  notes text,
  order_index smallint not null default 0,
  check (exercise_id is not null or custom_name is not null)
);

alter table public.workout_template_exercises enable row level security;

drop policy if exists "View exercises of visible templates" on public.workout_template_exercises;
create policy "View exercises of visible templates"
  on public.workout_template_exercises for select
  to authenticated
  using (
    exists (
      select 1 from public.workout_templates
      where workout_templates.id = workout_template_exercises.template_id
      and (workout_templates.trainer_id = auth.uid() or workout_templates.trainer_id is null)
    )
  );

drop policy if exists "Manage exercises of own templates" on public.workout_template_exercises;
create policy "Manage exercises of own templates"
  on public.workout_template_exercises for all
  using (
    exists (
      select 1 from public.workout_templates
      where workout_templates.id = workout_template_exercises.template_id
      and workout_templates.trainer_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.workout_templates
      where workout_templates.id = workout_template_exercises.template_id
      and workout_templates.trainer_id = auth.uid()
    )
  );

-- A starter programme we ship with the app (e.g. "Bodybuilding - 3 days a
-- week - Push/Pull/Legs"), suggested to a trainer based on a client's goal
-- and days_per_week when they haven't built a programme for that client yet.
create table if not exists public.programme_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  goal public.client_goal not null,
  days_per_week smallint not null check (days_per_week between 1 and 7),
  description text,
  created_at timestamptz not null default now(),
  -- Exactly one suggested template per goal + frequency combination, so
  -- looking up "the" recommended template for a client can never match
  -- more than one row.
  unique (goal, days_per_week)
);

alter table public.programme_templates enable row level security;

drop policy if exists "Everyone can view programme templates" on public.programme_templates;
create policy "Everyone can view programme templates"
  on public.programme_templates for select
  to authenticated
  using (true);

create table if not exists public.programme_template_days (
  id uuid primary key default gen_random_uuid(),
  programme_template_id uuid not null references public.programme_templates (id) on delete cascade,
  day_of_week public.day_of_week not null,
  workout_template_id uuid not null references public.workout_templates (id),
  unique (programme_template_id, day_of_week)
);

alter table public.programme_template_days enable row level security;

drop policy if exists "Everyone can view programme template days" on public.programme_template_days;
create policy "Everyone can view programme template days"
  on public.programme_template_days for select
  to authenticated
  using (true);

-- A client's actual, ongoing weekly schedule - one per client. Either built
-- from scratch or by applying a programme_template, which copies its
-- exercises in so they can be freely edited afterward without affecting the
-- template or any other client using it.
create table if not exists public.programmes (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.profiles (id) on delete cascade,
  client_id uuid not null references public.profiles (id) on delete cascade,
  name text not null default 'Training programme',
  created_at timestamptz not null default now(),
  -- Scoped to (trainer_id, client_id) rather than just client_id, so this
  -- doesn't rule out a client someday having more than one trainer.
  unique (trainer_id, client_id)
);

alter table public.programmes enable row level security;

drop policy if exists "Trainers can manage own client programmes" on public.programmes;
create policy "Trainers can manage own client programmes"
  on public.programmes for all
  using (auth.uid() = trainer_id)
  with check (auth.uid() = trainer_id);

drop policy if exists "Clients can view own programme" on public.programmes;
create policy "Clients can view own programme"
  on public.programmes for select
  using (auth.uid() = client_id);

create table if not exists public.programme_days (
  id uuid primary key default gen_random_uuid(),
  programme_id uuid not null references public.programmes (id) on delete cascade,
  day_of_week public.day_of_week not null,
  name text,
  is_rest boolean not null default true,
  created_at timestamptz not null default now(),
  unique (programme_id, day_of_week)
);

alter table public.programme_days enable row level security;

drop policy if exists "Trainers can manage own client programme days" on public.programme_days;
create policy "Trainers can manage own client programme days"
  on public.programme_days for all
  using (
    exists (
      select 1 from public.programmes
      where programmes.id = programme_days.programme_id
      and programmes.trainer_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.programmes
      where programmes.id = programme_days.programme_id
      and programmes.trainer_id = auth.uid()
    )
  );

drop policy if exists "Clients can view own programme days" on public.programme_days;
create policy "Clients can view own programme days"
  on public.programme_days for select
  using (
    exists (
      select 1 from public.programmes
      where programmes.id = programme_days.programme_id
      and programmes.client_id = auth.uid()
    )
  );

create table if not exists public.programme_exercises (
  id uuid primary key default gen_random_uuid(),
  programme_day_id uuid not null references public.programme_days (id) on delete cascade,
  exercise_id uuid references public.exercises (id),
  custom_name text,
  sets smallint not null,
  reps text not null,
  weight text,
  notes text,
  order_index smallint not null default 0,
  check (exercise_id is not null or custom_name is not null)
);

alter table public.programme_exercises enable row level security;

drop policy if exists "Trainers can manage own client programme exercises" on public.programme_exercises;
create policy "Trainers can manage own client programme exercises"
  on public.programme_exercises for all
  using (
    exists (
      select 1 from public.programme_days
      join public.programmes on programmes.id = programme_days.programme_id
      where programme_days.id = programme_exercises.programme_day_id
      and programmes.trainer_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.programme_days
      join public.programmes on programmes.id = programme_days.programme_id
      where programme_days.id = programme_exercises.programme_day_id
      and programmes.trainer_id = auth.uid()
    )
  );

drop policy if exists "Clients can view own programme exercises" on public.programme_exercises;
create policy "Clients can view own programme exercises"
  on public.programme_exercises for select
  using (
    exists (
      select 1 from public.programme_days
      join public.programmes on programmes.id = programme_days.programme_id
      where programme_days.id = programme_exercises.programme_day_id
      and programmes.client_id = auth.uid()
    )
  );

-- ============================================================================
-- Phase 4 - workout logging
-- ============================================================================

-- A record of one completed session. Deliberately does NOT lean on
-- programme_days/programme_exercises staying put - a trainer editing next
-- week's plan shouldn't be able to silently rewrite what a log says
-- happened last month. day_name/prescribed_* below are a snapshot taken at
-- the moment the client logs the workout.
create table if not exists public.workout_logs (
  id uuid primary key default gen_random_uuid(),
  -- Nullable + "set null" (not "cascade"): if a programme day is ever
  -- deleted, the log itself should survive as history - only the live
  -- link back to it goes away. Nothing deletes programme_days today, but
  -- the snapshot design (see comment below) is meant to hold even then.
  programme_day_id uuid references public.programme_days (id) on delete set null,
  client_id uuid not null references public.profiles (id) on delete cascade,
  day_name text,
  logged_date date not null default current_date,
  notes text,
  created_at timestamptz not null default now(),
  -- One log per day-slot per calendar date - logging the same day twice in
  -- one day updates the existing entry rather than creating a duplicate.
  unique (programme_day_id, logged_date)
);

alter table public.workout_logs enable row level security;

-- Constrains client_id AND requires programme_day_id to actually be one of
-- the caller's own programme's days. The anon key is public and RLS is the
-- real security boundary here (not just the app code) - without this,
-- client A could insert a log row pointing at client B's programme_day_id,
-- taking the (programme_day_id, logged_date) slot B needs for their own log.
drop policy if exists "Clients can manage own workout logs" on public.workout_logs;
create policy "Clients can manage own workout logs"
  on public.workout_logs for all
  using (auth.uid() = client_id)
  with check (
    auth.uid() = client_id
    and (
      programme_day_id is null
      or exists (
        select 1 from public.programme_days
        join public.programmes on programmes.id = programme_days.programme_id
        where programme_days.id = workout_logs.programme_day_id
        and programmes.client_id = auth.uid()
      )
    )
  );

drop policy if exists "Trainers can view their clients' workout logs" on public.workout_logs;
create policy "Trainers can view their clients' workout logs"
  on public.workout_logs for select
  using (
    exists (
      select 1 from public.programme_days
      join public.programmes on programmes.id = programme_days.programme_id
      where programme_days.id = workout_logs.programme_day_id
      and programmes.trainer_id = auth.uid()
    )
  );

create table if not exists public.workout_log_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_log_id uuid not null references public.workout_logs (id) on delete cascade,
  exercise_id uuid references public.exercises (id),
  custom_name text,
  prescribed_sets smallint,
  prescribed_reps text,
  prescribed_weight text,
  order_index smallint not null default 0,
  check (exercise_id is not null or custom_name is not null),
  -- Guards against a double-submit (e.g. two tabs) interleaving with the
  -- delete-then-reinsert re-log flow and duplicating an exercise - turns a
  -- silent race into a clear error instead.
  unique (workout_log_id, order_index)
);

alter table public.workout_log_exercises enable row level security;

drop policy if exists "Clients can manage own workout log exercises" on public.workout_log_exercises;
create policy "Clients can manage own workout log exercises"
  on public.workout_log_exercises for all
  using (
    exists (
      select 1 from public.workout_logs
      where workout_logs.id = workout_log_exercises.workout_log_id
      and workout_logs.client_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.workout_logs
      where workout_logs.id = workout_log_exercises.workout_log_id
      and workout_logs.client_id = auth.uid()
    )
  );

drop policy if exists "Trainers can view their clients' workout log exercises" on public.workout_log_exercises;
create policy "Trainers can view their clients' workout log exercises"
  on public.workout_log_exercises for select
  using (
    exists (
      select 1 from public.workout_logs
      join public.programme_days on programme_days.id = workout_logs.programme_day_id
      join public.programmes on programmes.id = programme_days.programme_id
      where workout_logs.id = workout_log_exercises.workout_log_id
      and programmes.trainer_id = auth.uid()
    )
  );

create table if not exists public.workout_log_sets (
  id uuid primary key default gen_random_uuid(),
  workout_log_exercise_id uuid not null references public.workout_log_exercises (id) on delete cascade,
  set_number smallint not null,
  reps_completed smallint,
  weight_used text,
  unique (workout_log_exercise_id, set_number)
);

alter table public.workout_log_sets enable row level security;

drop policy if exists "Clients can manage own workout log sets" on public.workout_log_sets;
create policy "Clients can manage own workout log sets"
  on public.workout_log_sets for all
  using (
    exists (
      select 1 from public.workout_log_exercises
      join public.workout_logs on workout_logs.id = workout_log_exercises.workout_log_id
      where workout_log_exercises.id = workout_log_sets.workout_log_exercise_id
      and workout_logs.client_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.workout_log_exercises
      join public.workout_logs on workout_logs.id = workout_log_exercises.workout_log_id
      where workout_log_exercises.id = workout_log_sets.workout_log_exercise_id
      and workout_logs.client_id = auth.uid()
    )
  );

drop policy if exists "Trainers can view their clients' workout log sets" on public.workout_log_sets;
create policy "Trainers can view their clients' workout log sets"
  on public.workout_log_sets for select
  using (
    exists (
      select 1 from public.workout_log_exercises
      join public.workout_logs on workout_logs.id = workout_log_exercises.workout_log_id
      join public.programme_days on programme_days.id = workout_logs.programme_day_id
      join public.programmes on programmes.id = programme_days.programme_id
      where workout_log_exercises.id = workout_log_sets.workout_log_exercise_id
      and programmes.trainer_id = auth.uid()
    )
  );

-- ============================================================================
-- Phase 5 - nutrition tracking
-- ============================================================================

-- One row per client, holding the daily targets their trainer has set.
-- A client with no row yet just hasn't had targets set.
create table if not exists public.nutrition_targets (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.profiles (id) on delete cascade,
  client_id uuid not null references public.profiles (id) on delete cascade,
  daily_calories integer not null check (daily_calories > 0),
  daily_protein_g integer not null check (daily_protein_g >= 0),
  daily_carbs_g integer not null check (daily_carbs_g >= 0),
  daily_fat_g integer not null check (daily_fat_g >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Scoped to (trainer_id, client_id) rather than just client_id, matching
  -- the same future-proofing as programmes above.
  unique (trainer_id, client_id)
);

alter table public.nutrition_targets enable row level security;

-- Requires trainer_id AND that client_id is actually one of this trainer's
-- own clients (via trainer_clients) - without the second half, any trainer
-- could write (or keep reading after the relationship ends) targets for a
-- client who was never theirs, the same class of gap closed on workout_logs
-- in Phase 4.
drop policy if exists "Trainers can manage own client nutrition targets" on public.nutrition_targets;
create policy "Trainers can manage own client nutrition targets"
  on public.nutrition_targets for all
  to authenticated
  using (
    auth.uid() = trainer_id
    and exists (
      select 1 from public.trainer_clients
      where trainer_clients.client_id = nutrition_targets.client_id
      and trainer_clients.trainer_id = auth.uid()
    )
  )
  with check (
    auth.uid() = trainer_id
    and exists (
      select 1 from public.trainer_clients
      where trainer_clients.client_id = nutrition_targets.client_id
      and trainer_clients.trainer_id = auth.uid()
    )
  );

drop policy if exists "Clients can view own nutrition targets" on public.nutrition_targets;
create policy "Clients can view own nutrition targets"
  on public.nutrition_targets for select
  to authenticated
  using (auth.uid() = client_id);

-- One row per food a client has logged against a given calendar date.
-- Deliberately not linked to any programme/plan (there's no "prescribed"
-- side to nutrition here, unlike workout_logs) - just a plain diary entry
-- with the calories/macros for the amount actually eaten.
create table if not exists public.food_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  logged_date date not null default current_date,
  name text not null,
  -- Optional portion size, purely for the client's own reference (e.g.
  -- "200g" vs "500g" of the same food) - calories/macros below are always
  -- entered as the totals for whatever amount was actually eaten, not
  -- recalculated from this, so changing it never changes the totals.
  quantity_g integer check (quantity_g is null or quantity_g > 0),
  calories integer not null check (calories >= 0),
  protein_g numeric(6,1) not null default 0 check (protein_g >= 0),
  carbs_g numeric(6,1) not null default 0 check (carbs_g >= 0),
  fat_g numeric(6,1) not null default 0 check (fat_g >= 0),
  created_at timestamptz not null default now()
);

alter table public.food_logs add column if not exists quantity_g integer;
alter table public.food_logs drop constraint if exists food_logs_quantity_g_check;
alter table public.food_logs add constraint food_logs_quantity_g_check check (quantity_g is null or quantity_g > 0);

create index if not exists food_logs_client_date_idx
  on public.food_logs (client_id, logged_date);

alter table public.food_logs enable row level security;

drop policy if exists "Clients can manage own food logs" on public.food_logs;
create policy "Clients can manage own food logs"
  on public.food_logs for all
  to authenticated
  using (auth.uid() = client_id)
  with check (auth.uid() = client_id);

-- No programme/day ownership chain to lean on here (unlike workout_logs) -
-- a food log's only real link back to a trainer is the trainer_clients
-- relationship itself, so that's what this checks directly.
drop policy if exists "Trainers can view their clients' food logs" on public.food_logs;
create policy "Trainers can view their clients' food logs"
  on public.food_logs for select
  to authenticated
  using (
    exists (
      select 1 from public.trainer_clients
      where trainer_clients.client_id = food_logs.client_id
      and trainer_clients.trainer_id = auth.uid()
    )
  );
