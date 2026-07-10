# 🎉 Eventide

> A community **event listings platform** — discover, host and RSVP to local events.

Eventide is the capstone project for the SoftUni **"Software Technologies with AI"**
course. It's a fully functional, multi-page JavaScript application backed by
Supabase, built with an AI-assisted development workflow.

- **Author:** Veselin Gerenski
- **Email:** veselingerenski@gmail.com
- **GitHub Repo:** https://github.com/VeselinGerenski/AI-development-July-2026
- **Live Project URL:** _added on deployment_
- **Sample credentials:** _added with demo data_

---

## What it does

- **Visitors** browse and search approved upcoming events by category.
- **Registered users** create/edit/delete their own events (with banner image
  upload), RSVP to events, and comment.
- **Admins** moderate the platform via an admin panel: approve/reject events,
  manage categories, and manage users.

## Tech stack

| Layer     | Technology                                              |
| --------- | ------------------------------------------------------- |
| Frontend  | Vanilla JavaScript (ES modules), HTML5, CSS3, Bootstrap 5, Bootstrap Icons |
| Build     | Node.js, npm, Vite                                      |
| Backend   | Supabase — Postgres, Auth (JWT), Storage, Row-Level Security |

## Project status

🚧 Under active development. See the [commit history](https://github.com/VeselinGerenski/AI-development-July-2026/commits)
for progress. Full architecture, database schema and setup docs land with the
documentation commit.

## Local development (quick start)

```bash
npm install
cp .env.example .env   # then fill in your Supabase URL + anon key
npm run dev
```

More detailed setup, architecture and schema documentation will be added to this
README as the project matures.
