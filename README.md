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

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, run [`supabase/schema.sql`](supabase/schema.sql).
3. Copy `.env.example` to `.env.local` and fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (Project Settings → API).
4. Restart `npm run dev`. You'll be asked to sign in with a magic link. On first sign-in, your local data is uploaded.

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
