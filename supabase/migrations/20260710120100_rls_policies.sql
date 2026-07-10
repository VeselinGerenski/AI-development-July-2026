-- ============================================================================
-- Eventide — Row-Level Security policies
-- Access control is enforced here, server-side, for every table.
-- ============================================================================

alter table public.profiles   enable row level security;
alter table public.user_roles enable row level security;
alter table public.categories enable row level security;
alter table public.events     enable row level security;
alter table public.rsvps      enable row level security;
alter table public.comments   enable row level security;

-- ---------- profiles ----------
-- Anyone may view profiles (public organizer info). Users edit only their own.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (true);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

-- ---------- user_roles ----------
-- A user can read their own role; admins can read and manage all roles.
drop policy if exists user_roles_select on public.user_roles;
create policy user_roles_select on public.user_roles
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists user_roles_admin_write on public.user_roles;
create policy user_roles_admin_write on public.user_roles
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- categories ----------
-- Public read; only admins create/update/delete.
drop policy if exists categories_select on public.categories;
create policy categories_select on public.categories
  for select using (true);

drop policy if exists categories_admin_write on public.categories;
create policy categories_admin_write on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- events ----------
-- Approved events are public. Organizers see their own (any status). Admins see all.
drop policy if exists events_select on public.events;
create policy events_select on public.events
  for select using (
    status = 'approved'
    or organizer_id = auth.uid()
    or public.is_admin()
  );

-- Authenticated users create events they own.
drop policy if exists events_insert_own on public.events;
create policy events_insert_own on public.events
  for insert with check (auth.uid() = organizer_id);

-- Organizers update/delete their own events; admins update/delete any.
-- (The guard_event_status trigger blocks status escalation by non-admins.)
drop policy if exists events_update on public.events;
create policy events_update on public.events
  for update using (organizer_id = auth.uid() or public.is_admin())
  with check (organizer_id = auth.uid() or public.is_admin());

drop policy if exists events_delete on public.events;
create policy events_delete on public.events
  for delete using (organizer_id = auth.uid() or public.is_admin());

-- ---------- rsvps ----------
-- RSVP lists (attendee counts/avatars) are public; users manage only their own RSVP.
drop policy if exists rsvps_select on public.rsvps;
create policy rsvps_select on public.rsvps
  for select using (true);

drop policy if exists rsvps_insert_own on public.rsvps;
create policy rsvps_insert_own on public.rsvps
  for insert with check (auth.uid() = user_id);

drop policy if exists rsvps_update_own on public.rsvps;
create policy rsvps_update_own on public.rsvps
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists rsvps_delete on public.rsvps;
create policy rsvps_delete on public.rsvps
  for delete using (auth.uid() = user_id or public.is_admin());

-- ---------- comments ----------
-- Comments are public to read; users write their own; owners/admins delete.
drop policy if exists comments_select on public.comments;
create policy comments_select on public.comments
  for select using (true);

drop policy if exists comments_insert_own on public.comments;
create policy comments_insert_own on public.comments
  for insert with check (auth.uid() = user_id);

drop policy if exists comments_update_own on public.comments;
create policy comments_update_own on public.comments
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists comments_delete on public.comments;
create policy comments_delete on public.comments
  for delete using (auth.uid() = user_id or public.is_admin());
