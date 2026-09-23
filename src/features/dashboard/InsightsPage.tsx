import { format, startOfWeek, subMonths, subWeeks } from 'date-fns'
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { PRIORITY_META } from '@/data/meta'
import { PageHeader } from '@/components/ui'
import type { Priority, Task } from '@/data/types'
import { ChartTooltip } from '@/components/ChartTooltip'
import { useChartTheme } from '@/lib/chart'
import { formatMoney, toISODate } from '@/lib/utils'
import { useData } from '@/store/data'

const STATUS_GROUPS = [
  { key: 'Not started', color: '#8e8ea6', match: (t: Task) => t.status === 'todo' },
  { key: 'In progress', color: '#8b5cf6', match: (t: Task) => t.status === 'in_progress' || t.status === 'review' },
  { key: 'Completed', color: '#22c55e', match: (t: Task) => t.status === 'done' },
]

function MonthDonut({ label, tasks, surface }: { label: string; tasks: Task[]; surface: string }) {
  const rows = STATUS_GROUPS.map((g) => ({ name: g.key, value: tasks.filter(g.match).length, fill: g.color }))
  const total = tasks.length
  return (
    <div className="flex items-center gap-4 rounded-xl border border-line p-4">
      <div className="relative h-20 w-20 shrink-0">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={total ? rows : [{ name: 'Empty', value: 1, fill: 'var(--surface-2)' }]} dataKey="value" innerRadius="62%" outerRadius="100%" stroke={surface} strokeWidth={2} isAnimationActive={false}>
              {(total ? rows : [{ fill: 'var(--surface-2)' }]).map((r, i) => (
                <Cell key={i} fill={r.fill} />
              ))}
            </Pie>
            {total > 0 && <Tooltip content={<ChartTooltip />} />}
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-xs font-semibold">
          {total ? `${Math.round((rows[2].value / total) * 100)}%` : '–'}
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider">{label}</div>
        {rows.map((r) => (
          <div key={r.name} className="flex items-center gap-2 text-xs">
            <span className="h-2 w-2 rounded-full" style={{ background: r.fill }} />
            <span className="flex-1 text-muted">{r.name}</span>
            <span className="font-semibold">{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function InsightsPage() {
  const { tasks, expenses, projects, settings } = useData()
  const theme = useChartTheme()

  const priorityData = (Object.keys(PRIORITY_META) as Priority[]).map((p) => ({
    name: PRIORITY_META[p].label,
    Open: tasks.filter((t) => t.priority === p && t.status !== 'done').length,
    fill: PRIORITY_META[p].color,
  }))

  const statusData = STATUS_GROUPS.map((g) => ({ name: g.key, Tasks: tasks.filter(g.match).length, fill: g.color }))

  const weeks = Array.from({ length: 8 }, (_, i) => {
    const start = startOfWeek(subWeeks(new Date(), 7 - i), { weekStartsOn: 1 })
    const s = toISODate(start)
    const e = toISODate(startOfWeek(subWeeks(new Date(), 6 - i), { weekStartsOn: 1 }))
    return { week: format(start, 'MMM d'), Completed: tasks.filter((t) => t.completedAt && t.completedAt.slice(0, 10) >= s && t.completedAt.slice(0, 10) < e).length }
  })

  const months = Array.from({ length: 6 }, (_, i) => subMonths(new Date(), 5 - i))
  const monthOf = (t: Task) => (t.dueDate ?? t.createdAt).slice(0, 7)

  const projectSpend = projects
    .map((p) => ({ name: p.name, Spent: Math.round(expenses.filter((e) => e.projectId === p.id).reduce((s, e) => s + e.amount, 0)), fill: p.color }))
    .filter((p) => p.Spent > 0)
    .sort((a, b) => b.Spent - a.Spent)

  const axis = { tickLine: false, axisLine: false, tick: { fill: theme.axis, fontSize: 11 } }

  return (
    <>
      <PageHeader title="Insights" subtitle="See how your work and spending are trending." />

      <div className="mb-5 grid gap-5 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-4 text-sm font-semibold">Open tasks by priority</h2>
          <div className="h-52">
            <ResponsiveContainer>
              <BarChart data={priorityData} layout="vertical" barCategoryGap="25%" margin={{ right: 28 }}>
                <CartesianGrid horizontal={false} stroke={theme.grid} />
                <XAxis type="number" allowDecimals={false} {...axis} />
                <YAxis type="category" dataKey="name" width={64} {...axis} />
                <Tooltip cursor={{ fill: theme.grid, opacity: 0.5 }} content={<ChartTooltip />} />
                <Bar dataKey="Open" radius={[0, 4, 4, 0]} label={{ position: 'right', fill: theme.axis, fontSize: 11 }}>
                  {priorityData.map((d) => (
                    <Cell key={d.name} fill={d.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="card p-5">
          <h2 className="mb-4 text-sm font-semibold">Status tracking</h2>
          <div className="h-52">
            <ResponsiveContainer>
              <BarChart data={statusData} barCategoryGap="35%" margin={{ top: 16 }}>
                <CartesianGrid vertical={false} stroke={theme.grid} />
                <XAxis dataKey="name" {...axis} />
                <YAxis allowDecimals={false} width={28} {...axis} />
                <Tooltip cursor={{ fill: theme.grid, opacity: 0.5 }} content={<ChartTooltip />} />
                <Bar dataKey="Tasks" radius={[4, 4, 0, 0]} label={{ position: 'top', fill: theme.axis, fontSize: 11 }}>
                  {statusData.map((d) => (
                    <Cell key={d.name} fill={d.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className="card mb-5 p-5">
        <h2 className="mb-4 text-sm font-semibold">Monthly task tracker</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {months.map((m) => {
            const key = format(m, 'yyyy-MM')
            return <MonthDonut key={key} label={format(m, 'MMMM')} tasks={tasks.filter((t) => monthOf(t) === key)} surface={theme.surface} />
          })}
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-4 text-sm font-semibold">Tasks completed per week</h2>
          <div className="h-56">
            <ResponsiveContainer>
              <LineChart data={weeks}>
                <CartesianGrid vertical={false} stroke={theme.grid} />
                <XAxis dataKey="week" {...axis} />
                <YAxis allowDecimals={false} width={28} {...axis} />
                <Tooltip cursor={{ stroke: theme.axis, strokeDasharray: '3 3' }} content={<ChartTooltip />} />
                <Line type="monotone" dataKey="Completed" stroke={theme.accent} strokeWidth={2} dot={{ r: 4, fill: theme.accent, stroke: theme.surface, strokeWidth: 2 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="card p-5">
          <h2 className="mb-4 text-sm font-semibold">Spending by project (all time)</h2>
          {projectSpend.length ? (
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={projectSpend} layout="vertical" barCategoryGap="25%">
                  <CartesianGrid horizontal={false} stroke={theme.grid} />
                  <XAxis type="number" {...axis} tickFormatter={(v) => formatMoney(v, settings.currency, true)} />
                  <YAxis type="category" dataKey="name" width={120} {...axis} />
                  <Tooltip cursor={{ fill: theme.grid, opacity: 0.5 }} content={<ChartTooltip format={(v) => formatMoney(v, settings.currency)} />} />
                  <Bar dataKey="Spent" radius={[0, 4, 4, 0]}>
                    {projectSpend.map((d) => (
                      <Cell key={d.name} fill={d.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-10 text-center text-sm text-muted">No project spending yet.</p>
          )}
        </section>
      </div>
    </>
  )
}
