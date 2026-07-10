# Eventide — Agent Instructions

Project-wide context and guidelines for AI dev agents (GitHub Copilot / Claude).
Read this before generating or editing code.

## What the project is

**Eventide** is a community **event listings platform**. Visitors browse upcoming
events; registered users host events and RSVP; admins moderate content. Built for
the SoftUni "Software Technologies with AI" capstone.

## Tech stack (do not deviate)

- **Frontend:** Vanilla JavaScript (ES modules), HTML5, CSS3, **Bootstrap 5** + Bootstrap Icons.
- **Build:** Node.js, npm, **Vite**.
- **Backend:** **Supabase** — Postgres DB, Auth, Storage, Row-Level Security.
- ❌ No TypeScript. ❌ No React / Vue / Angular / Svelte. ❌ No jQuery.

## Architecture

- **Client–server:** static JS frontend talks to Supabase via `@supabase/supabase-js`
  (Supabase REST under the hood). No custom server.
- **Multi-page navigation** via a lightweight **hash router** (`src/router.js`).
  Each screen is its own module under `src/pages/`. No "everything-in-a-modal" SPA.
- **Layered, modular design:**
  - `src/pages/` — one file per screen. Each exports `async function render(params) → HTMLElement`.
  - `src/components/` — reusable UI (navbar, footer, event card, toast, spinner, modal).
  - `src/services/` — **all** Supabase access (auth, events, rsvps, comments, categories, storage).
  - `src/utils/` — DOM helpers, formatters, route guards.
  - `src/styles/` — CSS (theme variables + component styles).
  - `supabase/migrations/` — versioned SQL (schema, RLS, seed).

## Hard rules

1. **Pages/components never call Supabase directly** — always go through a service.
2. **Never duplicate query logic** — reuse existing service functions.
3. **Secrets** live in `.env` (`VITE_` prefixed) and are gitignored. Use `.env.example` as the template.
4. **Escape user-generated content** before inserting into the DOM (`utils/dom.js → escapeHtml`).
5. Every async view handles **loading, empty, and error** states.
6. Prefer Bootstrap utility classes; add scoped custom CSS only when needed.
7. Keep modules **small and single-responsibility**. No monolith files.
8. **Schema changes go through Supabase migrations** in `supabase/migrations/`, committed to git.

## Data model (see `supabase/migrations/`)

- `profiles` — 1:1 with `auth.users` (username, full_name, avatar_url, bio).
- `categories` — event categories (name, slug, icon, color).
- `events` — organizer → profiles, category → categories, banner in Storage, `status` (pending/approved/rejected).
- `rsvps` — (event, user) unique; status going/maybe.
- `comments` — (event, user), body.
- `user_roles` — RBAC (`role`: user | admin), enforced via RLS + `public.is_admin()`.

## Roles & access

- **user:** create/edit/delete own events, RSVP, comment on approved events.
- **admin:** approve/reject events, manage categories, delete any content, access `#/admin`.
- Access control is enforced **server-side by RLS policies**, not by hiding UI.

## Storage

- Bucket `event-banners` — event banner images.
- Bucket `avatars` — user profile pictures.
- Upload via `services/storageService.js`; store the public URL on the row.

## When generating code

- Match existing file style and naming (`camelCase` for JS, `kebab-case` for CSS classes/files where used).
- Reuse `utils/dom.js` helpers (`el`, `escapeHtml`) and existing components.
- Keep everything responsive (mobile-first) and accessible (labels, `alt`, `aria-*`).
