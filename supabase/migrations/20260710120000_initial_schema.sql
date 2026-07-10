-- ============================================================================
-- Eventide — initial schema
-- Tables: profiles, user_roles, categories, events, rsvps, comments
-- Plus helper functions and triggers (updated_at, new-user provisioning, is_admin)
-- ============================================================================

-- ---------- Enums ----------
do $$ begin
  create type public.app_role as enum ('user', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.event_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.rsvp_status as enum ('going', 'maybe');
exception when duplicate_object then null; end $$;

-- ---------- profiles (1:1 with auth.users) ----------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text unique not null,
  full_name   text,
  avatar_url  text,
  bio         text check (bio is null or char_length(bio) <= 500),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------- user_roles (RBAC) ----------
create table if not exists public.user_roles (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  role       public.app_role not null default 'user',
  created_at timestamptz not null default now()
);

-- ---------- categories ----------
create table if not exists public.categories (
  id         uuid primary key default gen_random_uuid(),
  name       text unique not null,
  slug       text unique not null,
  icon       text not null default 'bi-calendar-event',
  color      text not null default '#7c3aed',
  created_at timestamptz not null default now()
);

-- ---------- events ----------
create table if not exists public.events (
  id           uuid primary key default gen_random_uuid(),
  title        text not null check (char_length(title) between 3 and 120),
  description  text not null check (char_length(description) between 10 and 5000),
  banner_url   text,
  category_id  uuid references public.categories(id) on delete set null,
  organizer_id uuid not null references public.profiles(id) on delete cascade,
  location     text not null,
  event_date   timestamptz not null,
  capacity     int check (capacity is null or capacity > 0),
  status       public.event_status not null default 'pending',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists events_status_date_idx on public.events (status, event_date);
create index if not exists events_category_idx     on public.events (category_id);
create index if not exists events_organizer_idx    on public.events (organizer_id);

-- ---------- rsvps ----------
create table if not exists public.rsvps (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  status     public.rsvp_status not null default 'going',
  created_at timestamptz not null default now(),
  unique (event_id, user_id)
);

create index if not exists rsvps_event_idx on public.rsvps (event_id);
create index if not exists rsvps_user_idx  on public.rsvps (user_id);

-- ---------- comments ----------
create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index if not exists comments_event_idx on public.comments (event_id, created_at);

-- ============================================================================
-- Functions & triggers
-- ============================================================================

-- Keep updated_at fresh on row updates.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists events_set_updated_at on public.events;
create trigger events_set_updated_at before update on public.events
  for each row execute function public.set_updated_at();

-- Admin check used by RLS policies. SECURITY DEFINER avoids recursive RLS
-- evaluation when policies on user_roles reference this function.
create or replace function public.is_admin(uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles where user_id = uid and role = 'admin'
  );
$$;

-- Provision a profile + default role whenever a new auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, full_name, avatar_url)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'username', ''), 'user_' || substr(new.id::text, 1, 8)),
    nullif(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'avatar_url', '')
  );
  insert into public.user_roles (user_id, role) values (new.id, 'user')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Prevent non-admins from changing an event's moderation status (anti-escalation).
-- Organizers may edit their event content freely, but status transitions
-- (pending → approved/rejected) are reserved for admins.
create or replace function public.guard_event_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status and not public.is_admin() then
    new.status := old.status;
  end if;
  return new;
end;
$$;

drop trigger if exists events_guard_status on public.events;
create trigger events_guard_status before update on public.events
  for each row execute function public.guard_event_status();
