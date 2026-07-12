-- ============================================================================
-- Eventide — demo data seed (for the live sample environment)
-- Prerequisite: two auth users exist (created via the app / Auth API):
--   demo@eventide.app   (username: demo)
--   admin@eventide.app  (username: admin)
-- This script promotes the admin account and seeds approved demo events owned by
-- the demo user. Idempotent: re-running does not duplicate events.
-- ============================================================================

-- 1) Promote the demo admin account.
update public.user_roles set role = 'admin'
where user_id = (select id from auth.users where email = 'admin@eventide.app');

-- 2) Seed demo events (only if the demo user has none yet).
with demo_user as (
  select id from auth.users where email = 'demo@eventide.app'
)
insert into public.events
  (title, description, category_id, organizer_id, location, event_date, capacity, status)
select
  v.title,
  v.description,
  (select id from public.categories where slug = v.slug),
  (select id from demo_user),
  v.location,
  v.event_date,
  v.capacity,
  'approved'
from (values
  ('Rooftop Summer Jazz Night',
   E'Wind down the week with live jazz under the stars. Local trios and a guest saxophonist play two sets while the sun goes down over the city. Drinks and small plates available all evening.',
   'music', 'Sky Terrace, Sofia', timestamptz '2026-08-05 19:00+00', 120),

  ('AI & Startups Meetup 2026',
   E'Founders and builders share what they''re shipping with modern AI. Three lightning talks, a live demo hour, and plenty of time to network with the local tech community. Beginners welcome.',
   'tech', 'Sofia Tech Park, Hall B', timestamptz '2026-08-12 18:30+00', 200),

  ('Street Food Festival',
   E'Forty local vendors, one park, endless flavours. From smash burgers to vegan bowls and freshly baked pastries — bring your appetite and discover your new favourite food truck.',
   'food', 'City Park, Central Lawn', timestamptz '2026-08-16 12:00+00', 500),

  ('Sunrise Yoga in the Park',
   E'Start your Saturday with a gentle all-levels flow as the park wakes up. Mats provided if you don''t have your own. Followed by fresh juice and a short guided meditation.',
   'sports', 'Borisova Gradina, Meadow', timestamptz '2026-08-22 07:00+00', 60),

  ('Contemporary Art Walk',
   E'A guided evening tour through three pop-up galleries featuring emerging painters and digital artists. Meet the creators, ask questions, and enjoy a complimentary glass of wine.',
   'arts', 'National Gallery Quarter', timestamptz '2026-09-03 18:00+00', 80),

  ('Community Beach Cleanup',
   E'Join neighbours and volunteers for a morning of caring for our coast. Gloves, bags and refreshments provided. Family-friendly — kids welcome with a guardian. Let''s leave it better than we found it.',
   'community', 'Black Sea Coast, North Beach', timestamptz '2026-09-07 09:00+00', 150)
) as v(title, description, slug, location, event_date, capacity)
where exists (select 1 from demo_user)
  and not exists (
    select 1 from public.events e
    where e.organizer_id = (select id from demo_user)
  );
