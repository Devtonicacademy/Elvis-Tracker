# Elvis Tracker

A modern, keyboard-friendly tracker for **tasks, projects, apps/subscriptions, budget & expenses, and habits**, all in one place.
The dark-first UI is inspired by Mindset Stack. It also borrows the weekly-review and monthly-tracker ideas from classic planner templates.

## Features

- **Dashboard**: greeting, due/overdue counts, "next to work on", project progress rings, budget ring, renewals, habits
- **Today**: due and overdue tasks, a time-blocked day schedule (click an hour to plan), daily habits
- **Tasks**, with four views:
  - *List*: grouped into In progress / Review / Next / Later / Done, with priority chevrons, time estimates and tags
  - *Board*: drag-and-drop Kanban
  - *Next up*: picks what to work on based on due date, priority and progress
  - *Logbook*: completed tasks by day
- **Week**: day-by-day checklists with completion rings, strongest day and needs-focus day, a productivity score, and a weekly reflection
- **Calendar**: month grid with task due dates and app renewals
- **Habits**: 4-week grid with streaks
- **Budget**: monthly budget vs spend, 6-month trend, category donut, per-project budgets, expense log with CSV export
- **Apps**: products you're building (idea → building → live) and subscriptions you pay for, with monthly/yearly cost and renewal alerts
- **Insights**: tasks by priority and status, a monthly task tracker, weekly completions, spend by project
- **Projects**: goals with deadlines, progress, budgets, and linked tasks/expenses/apps

## Keyboard

| Keys | Action |
| --- | --- |
| `⌘/Ctrl K` or `/` | Command palette (search, jump, create) |
| `N` / `E` | New task / log expense |
| `G` then `D T L W C H B A I P` | Go to Dashboard, Today, Tasks, Week, Calendar, Habits, Budget, Apps, Insights, Projects |
| `?` | Show all shortcuts |

Quick-add understands `!high`, `#tag`, `today`/`tomorrow`/`fri`, `30m`/`2h` and `@project`.
Example: `Send invoice tomorrow !high #finance 30m @website`.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
npm run lint
```

The app starts with demo data. To start fresh, go to **Settings → Clear all data**.

## Storage

By default, everything is saved in your browser (localStorage). Use **Settings → Export backup** to save a JSON copy.

### Cloud sync with Supabase (optional)

Once the Supabase keys are set, the app requires sign-in (Google, or an email link). Each account's data is private, enforced by row-level security. New accounts start empty.

1. **Create a project** at [supabase.com](https://supabase.com) and wait for it to finish provisioning.
2. **Create the tables**: go to SQL Editor → New query, paste [`supabase/schema.sql`](supabase/schema.sql), and click Run.
3. **Set the auth URLs**: go to Authentication → URL Configuration.
   - Site URL: your Vercel URL, e.g. `https://elvis-tracker.vercel.app`
   - Redirect URLs: add the same URL, plus `http://localhost:5173` for local dev
4. **Turn on Google sign-in**:
   1. In [Google Cloud Console](https://console.cloud.google.com/apis/credentials): Create credentials → OAuth client ID → Web application.
   2. Under Authorized redirect URIs, add `https://<your-project-ref>.supabase.co/auth/v1/callback`. Supabase shows this callback URL on its Google provider page.
   3. In Supabase, go to Authentication → Sign In / Providers → Google. Enable it and paste the Client ID and Client Secret.
5. **Add the keys**: copy the Project URL and the anon/publishable key from Project Settings → API.
   - Vercel: Settings → Environment Variables → add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, then redeploy.
   - Local dev: put the same two values in `.env.local`.

The anon key is safe to expose in the browser; row-level security is what protects the data.

## Deploy to Vercel

1. On [vercel.com](https://vercel.com): **Add New → Project**, then import this GitHub repo.
2. Vercel detects Vite automatically. The build settings live in `vercel.json`, which also rewrites deep links such as `/budget` to the app.
3. (Optional) To use cloud sync, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` under **Settings → Environment Variables**. Without them, the app stores data in each visitor's browser.
4. Click **Deploy**. Every push to `main` redeploys, and pull requests get preview URLs.

## Tech

Vite, React 19, TypeScript, Tailwind CSS v4, Zustand, dnd-kit, Recharts, cmdk, date-fns, lucide icons, and Supabase (optional).

```
src/
  app/          layout, sidebar, auth gate
  components/   UI primitives, task panel, quick add, command palette
  data/         types, seed data, repository (local / Supabase)
  features/     dashboard, tasks, projects, apps, budget, calendar, habits, settings
  lib/          utils, shortcuts, quick-add parser, chart theme
  store/        Zustand stores
```
