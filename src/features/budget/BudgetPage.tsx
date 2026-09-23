import { addMonths, format, parseISO, startOfMonth, subMonths } from 'date-fns'
import { ChevronLeft, ChevronRight, Download, PiggyBank, Plus, Receipt, Repeat, Wallet } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Button, EmptyState, PageHeader, Progress, Select, StatCard } from '@/components/ui'
import { EXPENSE_CATEGORIES } from '@/data/types'
import { ChartTooltip } from '@/components/ChartTooltip'
import { foldOther, useChartTheme } from '@/lib/chart'
import { budgetTone, cn, formatMoney, monthlyCost } from '@/lib/utils'
import { useData } from '@/store/data'
import { useProjectMap } from '@/store/selectors'
import { useUI } from '@/store/ui'

export function BudgetPage() {
  const { expenses, apps, projects, settings, setSettings } = useData()
  const projectMap = useProjectMap()
  const openQuick = useUI((s) => s.openQuick)
  const theme = useChartTheme()
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const [category, setCategory] = useState('')
  const [projectId, setProjectId] = useState('')
  const [editingBudget, setEditingBudget] = useState(false)
  const money = (v: number) => formatMoney(v, settings.currency)
  const monthKey = format(month, 'yyyy-MM')

  const monthExpenses = useMemo(
    () => expenses.filter((e) => e.date.startsWith(monthKey)).sort((a, b) => b.date.localeCompare(a.date)),
    [expenses, monthKey],
  )
  const spent = monthExpenses.reduce((s, e) => s + e.amount, 0)
  const pct = settings.monthlyBudget ? (spent / settings.monthlyBudget) * 100 : 0
  const recurring = apps.filter((a) => a.status !== 'paused').reduce((s, a) => s + monthlyCost(a.cost, a.billing), 0)

  const byCategory = foldOther(
    Object.entries(
      monthExpenses.reduce<Record<string, number>>((acc, e) => ({ ...acc, [e.category]: (acc[e.category] ?? 0) + e.amount }), {}),
    ).map(([name, value]) => ({ name, value })),
  )

  const trend = Array.from({ length: 6 }, (_, i) => {
    const m = subMonths(month, 5 - i)
    const key = format(m, 'yyyy-MM')
    return { month: format(m, 'MMM'), Spent: Math.round(expenses.filter((e) => e.date.startsWith(key)).reduce((s, e) => s + e.amount, 0)) }
  })

  const visible = monthExpenses.filter((e) => (!category || e.category === category) && (!projectId || e.projectId === projectId))

  const exportCsv = () => {
    const rows = [['Date', 'Title', 'Category', 'Project', 'Amount'], ...visible.map((e) => [e.date, e.title, e.category, projectMap.get(e.projectId ?? '')?.name ?? '', e.amount.toFixed(2)])]
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `expenses-${monthKey}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <>
      <PageHeader
        title="Budget & expenses"
        subtitle="Know where every dollar goes."
        actions={
          <>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => setMonth(subMonths(month, 1))} aria-label="Previous month">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="w-28 text-center text-sm font-semibold">{format(month, 'MMMM yyyy')}</span>
              <Button variant="ghost" size="icon" onClick={() => setMonth(addMonths(month, 1))} aria-label="Next month">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="primary" onClick={() => openQuick('expense')}>
              <Plus className="h-4 w-4" /> Log expense
            </Button>
          </>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Spent this month" value={money(spent)} hint={`${monthExpenses.length} expenses`} icon={<Receipt className="h-4 w-4" />} tone="#8b5cf6" />
        <StatCard
          label="Monthly budget"
          icon={<Wallet className="h-4 w-4" />}
          tone="#0ea5e9"
          value={
            editingBudget ? (
              <input
                autoFocus
                type="number"
                defaultValue={settings.monthlyBudget}
                onBlur={(e) => {
                  setSettings({ monthlyBudget: parseFloat(e.target.value) || 0 })
                  setEditingBudget(false)
                }}
                onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                className="w-full rounded-lg border border-accent px-2 text-2xl outline-none"
              />
            ) : (
              <button className="cursor-pointer hover:text-accent" onClick={() => setEditingBudget(true)} title="Click to edit">
                {money(settings.monthlyBudget)}
              </button>
            )
          }
          hint="Click to edit"
        />
        <StatCard
          label={spent > settings.monthlyBudget ? 'Over budget' : 'Remaining'}
          value={<span style={{ color: budgetTone(pct) }}>{money(Math.abs(settings.monthlyBudget - spent))}</span>}
          hint={`${Math.round(pct)}% used`}
          icon={<PiggyBank className="h-4 w-4" />}
          tone={budgetTone(pct)}
        />
        <StatCard label="Subscriptions / mo" value={money(recurring)} hint={`${apps.filter((a) => a.billing === 'monthly' || a.billing === 'yearly').length} paid apps`} icon={<Repeat className="h-4 w-4" />} tone="#f59e0b" />
      </div>

      <div className="card mb-5 p-5">
        <div className="mb-2 flex justify-between text-sm">
          <span className="font-semibold">Monthly budget used</span>
          <span className="text-muted">
            {money(spent)} / {money(settings.monthlyBudget)}
          </span>
        </div>
        <Progress value={pct} color={budgetTone(pct)} className="h-2.5" />
      </div>

      <div className="mb-5 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="card p-5">
          <div className="mb-4 text-sm font-semibold">Spending, last 6 months</div>
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={trend} barCategoryGap="35%">
                <CartesianGrid vertical={false} stroke={theme.grid} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: theme.axis, fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: theme.axis, fontSize: 11 }} width={48} tickFormatter={(v) => formatMoney(v, settings.currency, true)} />
                <Tooltip cursor={{ fill: theme.grid, opacity: 0.5 }} content={<ChartTooltip format={money} />} />
                {settings.monthlyBudget > 0 && (
                  <ReferenceLine y={settings.monthlyBudget} stroke={theme.axis} strokeDasharray="4 4" label={{ value: 'Budget', fill: theme.axis, fontSize: 11, position: 'insideTopRight' }} />
                )}
                <Bar dataKey="Spent" radius={[4, 4, 0, 0]}>
                  {trend.map((_, i) => (
                    <Cell key={i} fill={i === trend.length - 1 ? theme.accent : theme.muted} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5">
          <div className="mb-4 text-sm font-semibold">By category</div>
          {byCategory.length ? (
            <div className="flex flex-col items-center gap-4 sm:flex-row lg:flex-col xl:flex-row">
              <div className="h-44 w-44 shrink-0">
                  <PieChart width={176} height={176}>
                    <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="100%" paddingAngle={2} stroke={theme.surface} strokeWidth={2} animationDuration={600}>
                      {byCategory.map((c, i) => (
                        <Cell key={c.name} fill={theme.series[i]} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip format={money} />} />
                  </PieChart>
              </div>
              <ul className="w-full space-y-2 text-sm">
                {byCategory.map((c, i) => (
                  <li key={c.name} className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ background: theme.series[i] }} />
                    <span className="flex-1 text-muted">{c.name}</span>
                    <span className="font-medium">{money(c.value)}</span>
                    <span className="w-10 text-right text-xs text-muted">{Math.round((c.value / spent) * 100)}%</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="py-10 text-center text-sm text-muted">No spending this month.</p>
          )}
        </div>
      </div>

      <div className="card mb-5 p-5">
        <div className="mb-4 text-sm font-semibold">Project budgets</div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects
            .filter((p) => p.budget > 0)
            .map((p) => {
              const used = expenses.filter((e) => e.projectId === p.id).reduce((s, e) => s + e.amount, 0)
              const ppct = (used / p.budget) * 100
              return (
                <div key={p.id} className="rounded-xl border border-line p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color }} />
                    <span className="flex-1 truncate text-sm font-medium">{p.name}</span>
                    <span className="text-xs font-semibold" style={{ color: budgetTone(ppct) }}>{Math.round(ppct)}%</span>
                  </div>
                  <Progress value={ppct} color={budgetTone(ppct)} />
                  <div className="mt-2 text-xs text-muted">
                    {money(used)} of {money(p.budget)}
                  </div>
                </div>
              )
            })}
        </div>
      </div>

      <div className="card p-3 sm:p-4">
        <div className="mb-2 flex flex-wrap items-center gap-2 px-2">
          <span className="mr-auto text-sm font-semibold">Expenses · {format(month, 'MMMM')}</span>
          <Select value={category} onChange={(e) => setCategory(e.target.value)} className="h-9 w-auto">
            <option value="">All categories</option>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
          <Select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="h-9 w-auto">
            <option value="">All projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </Select>
          <Button size="md" onClick={exportCsv} disabled={!visible.length}>
            <Download className="h-4 w-4" /> CSV
          </Button>
        </div>
        {visible.length ? (
          <div className="divide-y divide-line/60">
            {visible.map((e) => {
              const p = e.projectId ? projectMap.get(e.projectId) : undefined
              return (
                <button key={e.id} onClick={() => openQuick('expense', undefined, e.id)} className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-surface-2/70">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-surface-2 text-[11px] font-semibold leading-none text-muted">
                    <div className="text-center">
                      <div>{format(parseISO(e.date), 'd')}</div>
                      <div className="text-[9px] uppercase">{format(parseISO(e.date), 'MMM')}</div>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{e.title}</div>
                    <div className="flex items-center gap-2 text-xs text-muted">
                      {e.category}
                      {p && (
                        <span className="inline-flex items-center gap-1">
                          · <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.color }} /> {p.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={cn('text-sm font-semibold')}>−{money(e.amount)}</span>
                </button>
              )
            })}
          </div>
        ) : (
          <EmptyState icon={<Receipt className="h-5 w-5" />} title="No expenses" hint="Log one with the E key or the button above." />
        )}
      </div>
    </>
  )
}
