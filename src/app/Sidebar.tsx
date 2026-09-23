import {
  BarChart3,
  CalendarDays,
  CalendarRange,
  CheckSquare,
  FolderKanban,
  LayoutGrid,
  Moon,
  Plus,
  Repeat,
  Settings,
  Sun,
  SunMedium,
  Wallet,
  Boxes,
} from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { Progress } from '@/components/ui'
import { cn, daysUntil, todayISO } from '@/lib/utils'
import { useData } from '@/store/data'
import { toggleTheme, useUI } from '@/store/ui'

function NavItem({ to, icon, children, badge, end }: { to: string; icon: ReactNode; children: ReactNode; badge?: number; end?: boolean }) {
  const setSidebar = useUI((s) => s.setSidebar)
  return (
    <NavLink
      to={to}
      end={end}
      onClick={() => setSidebar(false)}
      className={({ isActive }) =>
        cn(
          'group flex h-9 items-center gap-3 rounded-xl px-3 text-sm font-medium transition',
          isActive ? 'bg-brand text-white shadow-lg shadow-violet-500/25' : 'text-muted hover:bg-surface-2 hover:text-fg',
        )
      }
    >
      {({ isActive }) => (
        <>
          <span className={cn('shrink-0 [&>svg]:h-[18px] [&>svg]:w-[18px]', isActive ? 'text-white' : 'text-muted group-hover:text-fg')}>{icon}</span>
          <span className="flex-1 truncate">{children}</span>
          {!!badge && (
            <span
              className={cn(
                'grid h-5 min-w-5 place-items-center rounded-md px-1 text-[10px] font-bold',
                isActive ? 'bg-white/25 text-white' : 'bg-red-500 text-white',
              )}
            >
              {badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  )
}

function SectionLabel({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-1 mt-6 flex items-center justify-between px-3">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted/80">{children}</span>
      {action}
    </div>
  )
}

export function Sidebar() {
  const tasks = useData((s) => s.tasks)
  const projects = useData((s) => s.projects)
  const openQuick = useUI((s) => s.openQuick)
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))

  const today = todayISO()
  const { todayCount, overdueByProject } = useMemo(() => {
    const open = tasks.filter((t) => t.status !== 'done')
    const overdueByProject: Record<string, number> = {}
    for (const t of open) if (t.projectId && t.dueDate && t.dueDate <= today) overdueByProject[t.projectId] = (overdueByProject[t.projectId] ?? 0) + 1
    return { todayCount: open.filter((t) => t.dueDate && t.dueDate <= today).length, overdueByProject }
  }, [tasks, today])

  const goals = projects
    .filter((p) => p.status === 'active' && p.deadline)
    .sort((a, b) => (a.deadline! < b.deadline! ? -1 : 1))
    .slice(0, 3)

  const progressOf = (id: string) => {
    const pts = tasks.filter((t) => t.projectId === id)
    return pts.length ? (pts.filter((t) => t.status === 'done').length / pts.length) * 100 : 0
  }

  return (
    <nav className="scrollbar-thin flex h-full flex-col overflow-y-auto px-3 pb-4 pt-5">
      <div className="mb-6 flex items-center gap-2.5 px-3">
        <div className="bg-brand grid h-8 w-8 place-items-center rounded-xl shadow-lg shadow-violet-500/30">
          <CheckSquare className="h-4 w-4 text-white" />
        </div>
        <div className="leading-tight">
          <div className="text-[15px] font-bold tracking-tight">Elvis Tracker</div>
          <div className="text-[11px] text-muted">Tasks · Apps · Money</div>
        </div>
      </div>

      <div className="flex flex-col gap-0.5">
        <NavItem to="/" end icon={<LayoutGrid />}>Dashboard</NavItem>
        <NavItem to="/today" icon={<SunMedium />} badge={todayCount}>Today</NavItem>
        <NavItem to="/tasks" icon={<CheckSquare />}>Tasks</NavItem>
        <NavItem to="/week" icon={<CalendarRange />}>Week</NavItem>
        <NavItem to="/calendar" icon={<CalendarDays />}>Calendar</NavItem>
        <NavItem to="/habits" icon={<Repeat />}>Habits</NavItem>
      </div>

      <SectionLabel>Money & tools</SectionLabel>
      <div className="flex flex-col gap-0.5">
        <NavItem to="/budget" icon={<Wallet />}>Budget</NavItem>
        <NavItem to="/apps" icon={<Boxes />}>Apps</NavItem>
        <NavItem to="/insights" icon={<BarChart3 />}>Insights</NavItem>
      </div>

      <SectionLabel
        action={
          <button onClick={() => openQuick('project')} className="cursor-pointer rounded-md p-0.5 text-muted hover:bg-surface-2 hover:text-fg" aria-label="New project">
            <Plus className="h-3.5 w-3.5" />
          </button>
        }
      >
        Projects
      </SectionLabel>
      <div className="flex flex-col gap-0.5">
        <NavItem to="/projects" end icon={<FolderKanban />}>All projects</NavItem>
        {projects
          .filter((p) => p.status !== 'done')
          .map((p) => (
            <NavItem key={p.id} to={`/projects/${p.id}`} badge={overdueByProject[p.id]} icon={<span className="block h-2.5 w-2.5 rounded-full" style={{ background: p.color }} />}>
              {p.name}
            </NavItem>
          ))}
      </div>

      {goals.length > 0 && (
        <>
          <SectionLabel>Goals</SectionLabel>
          <div className="flex flex-col gap-2">
            {goals.map((g) => {
              const days = daysUntil(g.deadline!)
              return (
                <NavLink key={g.id} to={`/projects/${g.id}`} className="rounded-xl border border-line bg-surface-2/50 p-3 transition hover:border-accent/40">
                  <div className="truncate text-sm font-semibold">{g.name}</div>
                  <Progress value={progressOf(g.id)} color={g.color} className="my-2 h-1" />
                  <div className={cn('text-[10px] font-bold uppercase tracking-wider', days < 0 ? 'text-red-500' : days <= 5 ? 'text-amber-500' : 'text-muted')}>
                    {days < 0 ? `Overdue ${-days} days` : days === 0 ? 'Due today' : `Due in ${days} days`}
                  </div>
                </NavLink>
              )
            })}
          </div>
        </>
      )}

      <div className="mt-auto flex flex-col gap-0.5 pt-6">
        <NavItem to="/settings" icon={<Settings />}>Settings</NavItem>
        <button
          onClick={() => setDark(toggleTheme())}
          className="flex h-9 cursor-pointer items-center gap-3 rounded-xl px-3 text-sm font-medium text-muted transition hover:bg-surface-2 hover:text-fg"
        >
          {dark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
          {dark ? 'Light mode' : 'Dark mode'}
        </button>
      </div>
    </nav>
  )
}
