import { addDays, addWeeks, format, isSameDay, startOfWeek } from 'date-fns'
import { ChevronLeft, ChevronRight, Flame, Plus, Target, Trophy } from 'lucide-react'
import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { PriorityIcon } from '@/components/task-bits'
import { Button, Checkbox, PageHeader, Progress, Ring, Textarea } from '@/components/ui'
import type { Reflection } from '@/data/types'
import { ChartTooltip } from '@/components/ChartTooltip'
import { useChartTheme } from '@/lib/chart'
import { cn, toISODate } from '@/lib/utils'
import { useData } from '@/store/data'
import { useUI } from '@/store/ui'

export function WeekPage() {
  const { tasks, reflections, toggleTask, create, patch } = useData()
  const { openQuick, openTask } = useUI()
  const theme = useChartTheme()
  const [offset, setOffset] = useState(0)
  const weekStart = startOfWeek(addWeeks(new Date(), offset), { weekStartsOn: 1 })
  const weekId = toISODate(weekStart)
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const stats = days.map((d) => {
    const iso = toISODate(d)
    const list = tasks.filter((t) => t.dueDate === iso).sort((a, b) => Number(a.status === 'done') - Number(b.status === 'done'))
    const done = list.filter((t) => t.status === 'done').length
    return { date: d, iso, list, done, total: list.length, pct: list.length ? Math.round((done / list.length) * 100) : 0 }
  })

  const totalDone = stats.reduce((s, d) => s + d.done, 0)
  const total = stats.reduce((s, d) => s + d.total, 0)
  const score = total ? Math.round((totalDone / total) * 100) : 0
  const withTasks = stats.filter((s) => s.total > 0)
  const strongest = withTasks.length ? withTasks.reduce((a, b) => (b.pct > a.pct || (b.pct === a.pct && b.done > a.done) ? b : a)) : null
  const weakest = withTasks.length > 1 ? withTasks.reduce((a, b) => (b.pct < a.pct ? b : a)) : null

  const reflection = reflections.find((r) => r.id === weekId)
  const saveReflection = (field: keyof Omit<Reflection, 'id'>, value: string) => {
    if (reflection) patch('reflections', weekId, { [field]: value })
    else create('reflections', { id: weekId, win: '', slowed: '', focus: '', [field]: value })
  }

  const chartData = stats.map((s) => ({ day: format(s.date, 'EEE'), Completed: s.done, Remaining: s.total - s.done }))

  return (
    <>
      <PageHeader
        title="Week"
        subtitle="Plan your week, manage priorities and reflect on how it went."
        actions={
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => setOffset(offset - 1)} aria-label="Previous week">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setOffset(0)}>
              This week
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setOffset(offset + 1)} aria-label="Next week">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      <div className="mb-5 grid gap-4 lg:grid-cols-[1fr_260px_260px]">
        <div className="card p-5">
          <div className="mb-1 flex items-baseline justify-between">
            <span className="text-sm font-semibold">Weekly task progress</span>
            <span className="text-xs text-muted">
              {format(weekStart, 'MMM d')} – {format(days[6], 'MMM d')}
            </span>
          </div>
          <div className="mb-2 flex gap-4 text-xs text-muted">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: theme.accent }} />Completed</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: theme.muted }} />Remaining</span>
          </div>
          <div className="h-40">
            <ResponsiveContainer>
              <BarChart data={chartData} barCategoryGap="30%">
                <CartesianGrid vertical={false} stroke={theme.grid} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: theme.axis, fontSize: 11 }} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: theme.axis, fontSize: 11 }} width={24} />
                <Tooltip cursor={{ fill: theme.grid, opacity: 0.5 }} content={<ChartTooltip />} />
                <Bar dataKey="Completed" stackId="a" fill={theme.accent} stroke={theme.surface} strokeWidth={2} />
                <Bar dataKey="Remaining" stackId="a" fill={theme.muted} radius={[4, 4, 0, 0]} stroke={theme.surface} strokeWidth={2} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card flex flex-col justify-center gap-4 p-5">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-500/15 text-amber-500"><Trophy className="h-4 w-4" /></span>
            <div>
              <div className="text-xs text-muted">Strongest day</div>
              <div className="font-semibold">{strongest ? `${format(strongest.date, 'EEEE')} · ${strongest.pct}%` : '—'}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-sky-500/15 text-sky-500"><Target className="h-4 w-4" /></span>
            <div>
              <div className="text-xs text-muted">Needs focus</div>
              <div className="font-semibold">{weakest && weakest !== strongest ? `${format(weakest.date, 'EEEE')} · ${weakest.pct}%` : '—'}</div>
            </div>
          </div>
        </div>

        <div className="card relative overflow-hidden p-5">
          <div className="bg-brand pointer-events-none absolute inset-0 opacity-10" />
          <div className="flex items-center gap-2 text-xs font-medium text-muted">
            <Flame className="h-4 w-4 text-accent" /> Weekly productivity score
          </div>
          <div className="text-brand mt-3 text-5xl font-bold tracking-tight">{score}%</div>
          <Progress value={score} className="mt-4" />
          <div className="mt-2 text-xs text-muted">{totalDone} of {total} planned tasks done</div>
        </div>
      </div>

      <div className="-mx-4 mb-5 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        <div className="grid min-w-[980px] grid-cols-7 gap-3">
          {stats.map((s) => {
            const isToday = isSameDay(s.date, new Date())
            return (
              <div key={s.iso} className={cn('card flex flex-col overflow-hidden', isToday && 'border-accent/60 ring-1 ring-accent/30')}>
                <div className={cn('px-3 py-2.5 text-center', isToday ? 'bg-brand text-white' : 'bg-surface-2/60')}>
                  <div className="text-sm font-semibold">{format(s.date, 'EEEE')}</div>
                  <div className={cn('text-[11px]', isToday ? 'text-white/80' : 'text-muted')}>{format(s.date, 'MMM d')}</div>
                </div>
                <div className="flex-1 space-y-1 p-2">
                  {s.list.map((t) => (
                    <div key={t.id} onClick={() => openTask(t.id)} className="flex cursor-pointer items-start gap-2 rounded-lg px-1.5 py-1.5 hover:bg-surface-2">
                      <Checkbox checked={t.status === 'done'} onChange={() => toggleTask(t.id)} color="#22c55e" className="mt-0.5" />
                      <span className={cn('flex-1 text-xs leading-snug', t.status === 'done' && 'text-muted line-through')}>{t.title}</span>
                      <PriorityIcon priority={t.priority} className="h-3.5 w-3.5" />
                    </div>
                  ))}
                  <button
                    onClick={() => openQuick('task', { dueDate: s.iso })}
                    className="flex w-full cursor-pointer items-center gap-1.5 rounded-lg px-1.5 py-1.5 text-xs text-muted hover:bg-surface-2 hover:text-fg"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add
                  </button>
                </div>
                <div className="flex flex-col items-center gap-2 border-t border-line p-3">
                  <Ring value={s.pct} size={64} color={s.pct === 100 ? '#22c55e' : 'var(--accent)'}>
                    {s.total ? `${s.pct}%` : '–'}
                  </Ring>
                  <div className="flex w-full justify-between text-[11px] text-muted">
                    <span>Done <b className="text-fg">{s.done}</b></span>
                    <span>Open <b className="text-fg">{s.total - s.done}</b></span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="card p-5">
        <div className="mb-4 text-sm font-semibold">Weekly reflection</div>
        <div className="grid gap-4 md:grid-cols-3" key={weekId}>
          {(
            [
              ['win', 'Best win this week?', 'It felt great to…'],
              ['slowed', 'What slowed me down?', 'Too many meetings, distractions…'],
              ['focus', 'One focus for next week', 'Ship the landing page…'],
            ] as const
          ).map(([field, label, ph]) => (
            <label key={field} className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted">{label}</span>
              <Textarea
                defaultValue={reflection?.[field] ?? ''}
                placeholder={ph}
                onBlur={(e) => e.target.value !== (reflection?.[field] ?? '') && saveReflection(field, e.target.value)}
              />
            </label>
          ))}
        </div>
      </div>
    </>
  )
}
