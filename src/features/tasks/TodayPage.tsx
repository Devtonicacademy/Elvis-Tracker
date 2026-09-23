import { format } from 'date-fns'
import { AlertTriangle, CalendarClock, Plus, Sparkles } from 'lucide-react'
import { TaskRow } from '@/components/task-bits'
import { Button, Checkbox, EmptyState, PageHeader, Ring } from '@/components/ui'
import { todayISO } from '@/lib/utils'
import { useData } from '@/store/data'
import { byFocus, useProjectMap } from '@/store/selectors'
import { useUI } from '@/store/ui'
import { DayTimeline } from './DayTimeline'

export function TodayPage() {
  const { tasks, habits, toggleHabit } = useData()
  const projects = useProjectMap()
  const openQuick = useUI((s) => s.openQuick)
  const today = todayISO()

  const overdue = tasks.filter((t) => t.status !== 'done' && t.dueDate && t.dueDate < today).sort(byFocus)
  const dueToday = tasks.filter((t) => t.dueDate === today).sort(byFocus)
  const inProgress = tasks.filter((t) => t.status === 'in_progress' && t.dueDate !== today && !(t.dueDate && t.dueDate < today))
  const doneToday = dueToday.filter((t) => t.status === 'done').length
  const pct = dueToday.length ? Math.round((doneToday / dueToday.length) * 100) : 0
  const pendingHabits = habits.filter((h) => !h.log.includes(today))
  const nextHabit = pendingHabits[0]
  const row = (t: (typeof tasks)[number]) => <TaskRow key={t.id} task={t} project={t.projectId ? projects.get(t.projectId) : undefined} />

  return (
    <>
      <PageHeader
        title="Today"
        subtitle={format(new Date(), 'EEEE, MMMM d')}
        actions={
          <Button variant="primary" onClick={() => openQuick('task', { dueDate: today })}>
            <Plus className="h-4 w-4" /> Add for today
          </Button>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          <div className="card flex items-center gap-5 p-5">
            <Ring value={pct} size={72} stroke={7} color="#22c55e">
              <span className="text-sm">{pct}%</span>
            </Ring>
            <div>
              <div className="text-lg font-semibold">
                {doneToday} of {dueToday.length} tasks done
              </div>
              <p className="text-sm text-muted">
                {pct === 100 && dueToday.length ? 'Everything done. Great work! 🎉' : overdue.length ? `${overdue.length} overdue task${overdue.length > 1 ? 's' : ''} need attention.` : 'Stay focused, one task at a time.'}
              </p>
            </div>
          </div>

          {overdue.length > 0 && (
            <section className="card border-red-500/30 p-3">
              <div className="flex items-center gap-2 px-3 pb-1 pt-1 text-sm font-semibold text-red-500">
                <AlertTriangle className="h-4 w-4" /> Overdue
              </div>
              {overdue.map(row)}
            </section>
          )}

          <section className="card p-3">
            <div className="px-3 pb-1 pt-1 text-sm font-semibold">Due today</div>
            {dueToday.length ? dueToday.map(row) : <p className="px-3 py-4 text-sm text-muted">Nothing due today.</p>}
          </section>

          {inProgress.length > 0 && (
            <section className="card p-3">
              <div className="px-3 pb-1 pt-1 text-sm font-semibold">Also in progress</div>
              {inProgress.map(row)}
            </section>
          )}

          <section className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold">Today's habits</span>
              <span className="text-xs text-muted">
                {habits.length - pendingHabits.length}/{habits.length}
              </span>
            </div>
            {habits.length ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {habits.map((h) => (
                  <label key={h.id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-line px-3 py-2.5 transition hover:border-accent/40">
                    <Checkbox checked={h.log.includes(today)} onChange={() => toggleHabit(h.id)} color={h.color} />
                    <span className="text-sm">{h.name}</span>
                  </label>
                ))}
              </div>
            ) : (
              <EmptyState icon={<Sparkles className="h-5 w-5" />} title="No habits yet" action={<Button size="sm" onClick={() => openQuick('habit')}>Add a habit</Button>} />
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <div className="card p-4">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
              <CalendarClock className="h-4 w-4 text-accent" /> Schedule
              <span className="ml-auto text-xs font-normal text-muted">Click an hour to plan</span>
            </div>
            <div className="scrollbar-thin max-h-[560px] overflow-y-auto pr-1 pt-2">
              <DayTimeline tasks={tasks} />
            </div>
          </div>
          {nextHabit && (
            <div className="card overflow-hidden">
              <div className="flex items-center gap-3 p-4">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">Next habit</span>
                <span className="flex-1 truncate rounded-lg px-2.5 py-1 text-sm font-medium text-white" style={{ background: nextHabit.color }}>
                  {nextHabit.name}
                </span>
              </div>
              <div className="grid grid-cols-1 border-t border-line">
                <button onClick={() => toggleHabit(nextHabit.id)} className="cursor-pointer py-2.5 text-xs font-semibold uppercase tracking-wider text-muted transition hover:bg-surface-2 hover:text-fg">
                  Complete
                </button>
              </div>
            </div>
          )}
        </aside>
      </div>
    </>
  )
}
