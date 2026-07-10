-- ============================================================================
-- Eventide — seed reference data (event categories)
-- Safe to run repeatedly; existing slugs are left untouched.
-- ============================================================================

insert into public.categories (name, slug, icon, color) values
  ('Music',           'music',     'bi-music-note-beamed', '#ec4899'),
  ('Tech & Startups', 'tech',      'bi-cpu',               '#6366f1'),
  ('Food & Drink',    'food',      'bi-cup-hot',           '#f59e0b'),
  ('Sports & Fitness','sports',    'bi-bicycle',           '#10b981'),
  ('Arts & Culture',  'arts',      'bi-palette',           '#8b5cf6'),
  ('Community',       'community', 'bi-people',            '#14b8a6'),
  ('Business',        'business',  'bi-briefcase',         '#0ea5e9'),
  ('Education',       'education', 'bi-mortarboard',       '#f43f5e')
on conflict (slug) do nothing;
