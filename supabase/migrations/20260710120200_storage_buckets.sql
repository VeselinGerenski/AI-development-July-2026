-- ============================================================================
-- Eventide — Storage buckets & policies
-- Two public buckets: event banners and user avatars.
-- Files are namespaced by user id ("<uid>/<file>") so users manage only their own.
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('event-banners', 'event-banners', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Public read for both buckets (images render via public URL).
drop policy if exists "eventide public read" on storage.objects;
create policy "eventide public read" on storage.objects
  for select using (bucket_id in ('event-banners', 'avatars'));

-- Authenticated users may upload into their own folder only.
drop policy if exists "eventide user upload" on storage.objects;
create policy "eventide user upload" on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('event-banners', 'avatars')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users may update/replace their own files.
drop policy if exists "eventide user update" on storage.objects;
create policy "eventide user update" on storage.objects
  for update to authenticated
  using (
    bucket_id in ('event-banners', 'avatars')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users may delete their own files.
drop policy if exists "eventide user delete" on storage.objects;
create policy "eventide user delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('event-banners', 'avatars')
    and (storage.foldername(name))[1] = auth.uid()::text
  );
