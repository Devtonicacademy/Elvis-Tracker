import type { ReactNode } from 'react'
import { format, subDays } from 'date-fns'
import { AlertTriangle, ArrowRight, CalendarCheck, CalendarClock, CheckCircle2, Receipt, Sparkles, Target } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { TaskRow } from '@/components/task-bits'
import { Button, Checkbox, Progress, Ring, StatCard } from '@/components/ui'
import { ChartTooltip } from '@/components/ChartTooltip'
import { useChartTheme } from '@/lib/chart'
import { budgetTone, daysUntil, formatMoney, relativeDue, toISODate, todayISO } from '@/lib/utils'
import { useData } from '@/store/data'
import { byFocus, useProjectMap } from '@/store/selectors'
import { useUI } from '@/store/ui'

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

function Panel({ title, to, children, className = '' }: { title: string; to?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`card p-5 ${className}`}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">{title}</h2>
        {to && (
          <Link to={to} className="inline-flex items-center gap-1 text-xs text-muted hover:text-accent">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>
      {children}
    </section>
  )
}

export function DashboardPage() {
  const { tasks, projects, expenses, apps, habits, settings, toggleHabit } = useData()
  const projectMap = useProjectMap()
  const openQuick = useUI((s) => s.openQuick)
  const theme = useChartTheme()
  const navigate = useNavigate()
  const today = todayISO()
  const money = (v: number) => formatMoney(v, settings.currency)

  const open = tasks.filter((t) => t.status !== 'done')
  const dueToday = open.filter((t) => t.dueDate === today)
  const overdue = open.filter((t) => t.dueDate && t.dueDate < today)
  const weekAgo = toISODate(subDays(new Date(), 6))
  const doneWeek = tasks.filter((t) => t.completedAt && t.completedAt.slice(0, 10) >= weekAgo)
  const monthKey = today.slice(0, 7)
  const spent = expenses.filter((e) => e.date.startsWith(monthKey)).reduce((s, e) => s + e.amount, 0)
  const bpct = settings.monthlyBudget ? (spent / settings.monthlyBudget) * 100 : 0
  const nextUp = [...open].sort(byFocus).slice(0, 6)
  const renewals = apps
    .filter((a) => a.renewalDate && a.status !== 'paused' && daysUntil(a.renewalDate) >= 0)
    .sort((a, b) => a.renewalDate!.localeCompare(b.renewalDate!))
    .slice(0, 4)

  const activity = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i)
    const iso = toISODate(d)
    return { day: format(d, 'EEE'), Completed: tasks.filter((t) => t.completedAt?.slice(0, 10) === iso).length }
  })

  return (
    <>
      <div className="relative mb-6 overflow-hidden rounded-3xl border border-line p-6 sm:p-8">
        <div className="bg-brand pointer-events-none absolute inset-0 opacity-[0.12]" />
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-violet-500/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-muted">{format(new Date(), 'EEEE, MMMM d')}</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              {greeting()}, <span className="text-brand">{settings.name || 'there'}</span> 👋
            </h1>
            <p className="mt-2 max-w-lg text-sm text-muted">
              You have <b className="text-fg">{dueToday.length} tasks</b> due today
              {overdue.length > 0 && <>, <b className="text-red-500">{overdue.length} overdue</b></>} and you've spent{' '}
              <b className="text-fg">{Math.round(bpct)}%</b> of this month's budget.
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => openQuick('expense')}>
              <Receipt className="h-4 w-4" /> Log expense
            </Button>
            <Button variant="primary" onClick={() => navigate('/today')}>
              <Target className="h-4 w-4" /> Plan today
            </Button>
          </div>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Due today" value={dueToday.length} hint={`${open.length} open in total`} icon={<CalendarCheck className="h-4 w-4" />} tone="#8b5cf6" />
        <StatCard label="Overdue" value={overdue.length} hint={overdue.length ? 'Needs attention' : 'All caught up'} icon={<AlertTriangle className="h-4 w-4" />} tone="#ef4444" />
        <StatCard label="Done this week" value={doneWeek.length} hint="Last 7 days" icon={<CheckCircle2 className="h-4 w-4" />} tone="#22c55e" />
        <StatCard label="Spent this month" value={money(spent)} hint={<Progress value={bpct} color={budgetTone(bpct)} className="mt-1" />} icon={<Receipt className="h-4 w-4" />} tone="#f59e0b" />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel title="Next to work on" to="/tasks?view=next" className="xl:col-span-2">
          <div className="-mx-3">
            {nextUp.map((t) => (
              <TaskRow key={t.id} task={t} project={t.projectId ? projectMap.get(t.projectId) : undefined} />
            ))}
            {!nextUp.length && <p className="px-3 py-6 text-center text-sm text-muted">Nothing on your plate. 🎉</p>}
          </div>
        </Panel>

        <Panel title="Completed, last 7 days">
          <div className="h-44">
            <ResponsiveContainer>
              <BarChart data={activity} barCategoryGap="30%">
                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: theme.axis, fontSize: 11 }} />
                <Tooltip cursor={{ fill: theme.grid, opacity: 0.5 }} content={<ChartTooltip />} />
                <Bar dataKey="Completed" fill={theme.accent} radius={[4, 4, 0, 0]} maxBarSize={28} minPointSize={2} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Active projects" to="/projects" className="xl:col-span-2">
          <div className="grid gap-3 sm:grid-cols-2">
            {projects
              .filter((p) => p.status === 'active')
              .map((p) => {
                const pt = tasks.filter((t) => t.projectId === p.id)
                const pct = pt.length ? Math.round((pt.filter((t) => t.status === 'done').length / pt.length) * 100) : 0
                return (
                  <Link key={p.id} to={`/projects/${p.id}`} className="flex items-center gap-3 rounded-xl border border-line p-3 transition hover:border-accent/40">
                    <Ring value={pct} size={44} stroke={4} color={p.color}>
                      <span className="text-[10px]">{pct}%</span>
                    </Ring>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{p.name}</div>
                      <div className="text-xs text-muted">
                        {pt.filter((t) => t.status !== 'done').length} open{p.deadline && ` · due ${relativeDue(p.deadline).toLowerCase()}`}
                      </div>
                    </div>
                  </Link>
                )
              })}
          </div>
        </Panel>

        <Panel title="Today's habits" to="/habits">
          <div className="space-y-1.5">
            {habits.map((h) => (
              <label key={h.id} className="flex cursor-pointer items-center gap-3 rounded-lg px-1 py-1.5 hover:bg-surface-2">
                <Checkbox checked={h.log.includes(today)} onChange={() => toggleHabit(h.id)} color={h.color} />
                <span className="text-sm">{h.name}</span>
              </label>
            ))}
            {!habits.length && (
              <button onClick={() => openQuick('habit')} className="flex cursor-pointer items-center gap-2 text-sm text-muted hover:text-accent">
                <Sparkles className="h-4 w-4" /> Add your first habit
              </button>
            )}
          </div>
        </Panel>

        <Panel title="Upcoming renewals" to="/apps" className="xl:col-span-2">
          {renewals.length ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {renewals.map((a) => (
                <button key={a.id} onClick={() => openQuick('app', undefined, a.id)} className="flex cursor-pointer items-center gap-3 rounded-xl border border-line p-3 text-left transition hover:border-accent/40">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-surface-2 text-muted">
                    <CalendarClock className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{a.name}</span>
                    <span className={`text-xs ${daysUntil(a.renewalDate!) <= 7 ? 'text-amber-500' : 'text-muted'}`}>{relativeDue(a.renewalDate!)}</span>
                  </span>
                  <span className="text-sm font-semibold">{money(a.cost)}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">No renewals coming up.</p>
          )}
        </Panel>

        <Panel title="Budget" to="/budget">
          <div className="flex items-center gap-4">
            <Ring value={bpct} size={84} stroke={8} color={budgetTone(bpct)}>
              <span className="text-sm">{Math.round(bpct)}%</span>
            </Ring>
            <div className="text-sm">
              <div className="text-muted">Spent</div>
              <div className="text-lg font-bold">{money(spent)}</div>
              <div className="text-xs text-muted">of {money(settings.monthlyBudget)} this month</div>
            </div>
          </div>
        </Panel>
      </div>
    </>
  )
}
