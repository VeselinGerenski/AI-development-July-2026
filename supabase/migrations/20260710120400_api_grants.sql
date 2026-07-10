-- ============================================================================
-- Eventide — API role grants
-- Grant the PostgREST roles (anon, authenticated) access to the public schema.
-- Row-Level Security still controls WHICH rows each role may see/modify; these
-- grants only allow the roles to reach the tables so RLS can be evaluated.
-- (Required on projects where default privileges are not pre-applied.)
-- ============================================================================

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;

-- Ensure future tables/sequences are covered automatically.
alter default privileges in schema public
  grant select, insert, update, delete on tables to anon, authenticated;
alter default privileges in schema public
  grant usage, select on sequences to anon, authenticated;
