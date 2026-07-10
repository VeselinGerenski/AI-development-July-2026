# Supabase backend

This folder holds the versioned database schema for Eventide. The migration
history is committed so the backend can be rebuilt from scratch.

## Migrations (apply in order)

| # | File | Purpose |
|---|------|---------|
| 1 | `20260710120000_initial_schema.sql` | Tables, indexes, functions, triggers |
| 2 | `20260710120100_rls_policies.sql`   | Row-Level Security policies |
| 3 | `20260710120200_storage_buckets.sql`| Storage buckets + object policies |
| 4 | `20260710120300_seed_categories.sql`| Seed event categories |
| 5 | `20260710120400_api_grants.sql`     | Grant anon/authenticated roles access (RLS still applies) |

## Option A — Supabase Dashboard (no CLI needed)

1. Create a free project at https://supabase.com.
2. Open **SQL Editor** → **New query**.
3. Paste the contents of each migration file **in order** (1 → 4) and run each.
4. Get your **Project URL** and **anon public key** from
   **Project Settings → API**, and put them in the app's `.env`.

## Option B — Supabase CLI

```bash
supabase login
supabase link --project-ref <your-project-ref>
supabase db push        # applies everything in supabase/migrations
```

## Making an admin

Roles live in `public.user_roles`. After a user registers, promote them in the
SQL Editor:

```sql
update public.user_roles set role = 'admin'
where user_id = (select id from auth.users where email = 'admin@eventide.app');
```

## Schema overview

```
auth.users ──1:1── profiles ──1:1── user_roles (role: user | admin)
                      │
                      ├──< events >── categories
                      │        │
                      │        ├──< rsvps
                      │        └──< comments
```

All write access is governed by RLS; admin actions are gated by
`public.is_admin()`.
