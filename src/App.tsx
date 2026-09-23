import type { ComponentType } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AuthGate } from './app/AuthGate'
import { Layout } from './app/Layout'

// Pages are code-split so the charts library only loads where it's used.
const page = (load: () => Promise<Record<string, ComponentType>>, name: string) => ({
  lazy: async () => ({ Component: (await load())[name] }),
})

const router = createBrowserRouter([
  {
    element: <Layout />,
    hydrateFallbackElement: <div />,
    children: [
      { path: '/', ...page(() => import('./features/dashboard/DashboardPage'), 'DashboardPage') },
      { path: '/today', ...page(() => import('./features/tasks/TodayPage'), 'TodayPage') },
      { path: '/tasks', ...page(() => import('./features/tasks/TasksPage'), 'TasksPage') },
      { path: '/week', ...page(() => import('./features/tasks/WeekPage'), 'WeekPage') },
      { path: '/calendar', ...page(() => import('./features/calendar/CalendarPage'), 'CalendarPage') },
      { path: '/habits', ...page(() => import('./features/habits/HabitsPage'), 'HabitsPage') },
      { path: '/projects', ...page(() => import('./features/projects/ProjectsPage'), 'ProjectsPage') },
      { path: '/projects/:id', ...page(() => import('./features/projects/ProjectPage'), 'ProjectPage') },
      { path: '/apps', ...page(() => import('./features/apps/AppsPage'), 'AppsPage') },
      { path: '/budget', ...page(() => import('./features/budget/BudgetPage'), 'BudgetPage') },
      { path: '/insights', ...page(() => import('./features/dashboard/InsightsPage'), 'InsightsPage') },
      { path: '/settings', ...page(() => import('./features/settings/SettingsPage'), 'SettingsPage') },
      { path: '*', ...page(() => import('./features/dashboard/DashboardPage'), 'DashboardPage') },
    ],
  },
])

export function App() {
  return (
    <AuthGate>
      <RouterProvider router={router} />
    </AuthGate>
  )
}
