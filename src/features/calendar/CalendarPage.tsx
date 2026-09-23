import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, isToday, startOfMonth, startOfWeek, subMonths } from 'date-fns'
import { ChevronLeft, ChevronRight, Repeat } from 'lucide-react'
import { useState } from 'react'
import { PRIORITY_META } from '@/data/meta'
import { Button, PageHeader } from '@/components/ui'
import { cn, toISODate } from '@/lib/utils'
import { useData } from '@/store/data'
import { useProjectMap } from '@/store/selectors'
import { useUI } from '@/store/ui'

export function CalendarPage() {
  const { tasks, apps } = useData()
  const projects = useProjectMap()
  const { openTask, openQuick } = useUI()
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
  })

  return (
    <>
      <PageHeader
        title="Calendar"
        subtitle="Task due dates and app renewals at a glance."
        actions={
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => setMonth(subMonths(month, 1))} aria-label="Previous month">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="w-32 text-center text-sm font-semibold">{format(month, 'MMMM yyyy')}</span>
            <Button variant="ghost" size="icon" onClick={() => setMonth(addMonths(month, 1))} aria-label="Next month">
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button size="sm" className="ml-1" onClick={() => setMonth(startOfMonth(new Date()))}>
              Today
            </Button>
          </div>
        }
      />
      <div className="card overflow-hidden">
        <div className="grid grid-cols-7 border-b border-line bg-surface-2/50 text-center text-[11px] font-semibold uppercase tracking-wider text-muted">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
            <div key={d} className="py-2.5">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((d) => {
            const iso = toISODate(d)
            const dayTasks = tasks.filter((t) => t.dueDate === iso)
            const renewals = apps.filter((a) => a.renewalDate === iso)
            const hidden = Math.max(0, dayTasks.length - 3) + Math.max(0, renewals.length - 2)
            return (
              <div
                key={iso}
                onDoubleClick={() => openQuick('task', { dueDate: iso })}
                className={cn('group min-h-24 border-b border-r border-line/70 p-1.5 sm:min-h-32 [&:nth-child(7n)]:border-r-0', !isSameMonth(d, month) && 'bg-surface-2/30')}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span
                    className={cn(
                      'grid h-6 w-6 place-items-center rounded-full text-xs font-medium',
                      isToday(d) ? 'bg-brand text-white' : isSameMonth(d, month) ? 'text-fg' : 'text-muted/60',
                    )}
                  >
                    {format(d, 'd')}
                  </span>
                  <button onClick={() => openQuick('task', { dueDate: iso })} className="hidden cursor-pointer text-xs text-muted hover:text-accent group-hover:block" aria-label="Add task">
                    +
                  </button>
                </div>
                <div className="space-y-1">
                  {dayTasks.slice(0, 3).map((t) => {
                    const color = (t.projectId && projects.get(t.projectId)?.color) || PRIORITY_META[t.priority].color
                    return (
                      <button
                        key={t.id}
                        onClick={() => openTask(t.id)}
                        className={cn('block w-full cursor-pointer truncate rounded-md px-1.5 py-0.5 text-left text-[11px] font-medium transition hover:brightness-110', t.status === 'done' && 'line-through opacity-50')}
                        style={{ background: `${color}26`, color }}
                        title={t.title}
                      >
                        {t.startTime && <span className="opacity-70">{t.startTime} </span>}
                        {t.title}
                      </button>
                    )
                  })}
                  {renewals.slice(0, 2).map((a) => (
                    <button
                      key={a.id}
                      onClick={() => openQuick('app', undefined, a.id)}
                      className="flex w-full cursor-pointer items-center gap-1 truncate rounded-md border border-dashed border-line px-1.5 py-0.5 text-left text-[11px] text-muted hover:text-fg"
                    >
                      <Repeat className="h-3 w-3 shrink-0" /> {a.name}
                    </button>
                  ))}
                  {hidden > 0 && <div className="px-1.5 text-[10px] text-muted">+{hidden} more</div>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <p className="mt-3 text-xs text-muted">Tip: double-click a day to add a task.</p>
    </>
  )
}
