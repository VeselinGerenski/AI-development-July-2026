-- ============================================================================
-- Eventide — harden event moderation on INSERT
-- Previously guard_event_status only ran on UPDATE, so a non-admin could POST an
-- event with status='approved' and bypass moderation. This extends the guard to
-- INSERT: non-admins always get status='pending' on create, regardless of input.
-- ============================================================================

create or replace function public.guard_event_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if not public.is_admin() then
      new.status := 'pending';
    end if;
    return new;
  end if;

  -- UPDATE: non-admins may not change an event's moderation status.
  if new.status is distinct from old.status and not public.is_admin() then
    new.status := old.status;
  end if;
  return new;
end;
$$;

drop trigger if exists events_guard_status on public.events;
create trigger events_guard_status
  before insert or update on public.events
  for each row execute function public.guard_event_status();
