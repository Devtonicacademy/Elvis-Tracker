import { eachDayOfInterval, format, isToday, subDays } from 'date-fns'
import { Flame, Pencil, Plus, Repeat } from 'lucide-react'
import { Button, EmptyState, PageHeader, Ring } from '@/components/ui'
import type { Habit } from '@/data/types'
import { cn, toISODate, todayISO } from '@/lib/utils'
import { useData } from '@/store/data'
import { useUI } from '@/store/ui'

function streak(h: Habit) {
  const set = new Set(h.log)
  let n = 0
  let d = new Date()
  if (!set.has(toISODate(d))) d = subDays(d, 1) // today not done yet doesn't break the streak
  while (set.has(toISODate(d))) {
    n++
    d = subDays(d, 1)
  }
  return n
}

export function HabitsPage() {
  const { habits, toggleHabit } = useData()
  const openQuick = useUI((s) => s.openQuick)
  const days = eachDayOfInterval({ start: subDays(new Date(), 27), end: new Date() })
  const today = todayISO()
  const doneToday = habits.filter((h) => h.log.includes(today)).length

  return (
    <>
      <PageHeader
        title="Habits"
        subtitle="Small daily wins that compound."
        actions={
          <Button variant="primary" onClick={() => openQuick('habit')}>
            <Plus className="h-4 w-4" /> New habit
          </Button>
        }
      />
      {habits.length === 0 ? (
        <EmptyState icon={<Repeat className="h-5 w-5" />} title="No habits yet" hint="Build routines like reviewing tasks daily or logging expenses." action={<Button onClick={() => openQuick('habit')}>Add a habit</Button>} />
      ) : (
        <>
          <div className="card mb-5 flex items-center gap-5 p-5">
            <Ring value={(doneToday / habits.length) * 100} size={64} color="#22c55e">
              {doneToday}/{habits.length}
            </Ring>
            <div>
              <div className="font-semibold">Today's routine</div>
              <div className="text-sm text-muted">{doneToday === habits.length ? 'All habits done. Nice! 🔥' : `${habits.length - doneToday} to go today`}</div>
            </div>
          </div>
          <div className="card overflow-x-auto p-5">
            <table className="w-full min-w-[760px] border-separate border-spacing-y-2">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-muted">
                  <th className="w-56 text-left font-semibold">Habit</th>
                  {days.map((d) => (
                    <th key={d.toISOString()} className={cn('w-6 font-medium', isToday(d) && 'text-accent')}>
                      <div>{format(d, 'EEEEE')}</div>
                      <div className="font-normal normal-case">{format(d, 'd')}</div>
                    </th>
                  ))}
                  <th className="w-16 text-right font-semibold">Streak</th>
                </tr>
              </thead>
              <tbody>
                {habits.map((h) => {
                  const s = streak(h)
                  return (
                    <tr key={h.id} className="group">
                      <td className="pr-3">
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: h.color }} />
                          <span className="truncate text-sm font-medium">{h.name}</span>
                          <button onClick={() => openQuick('habit', undefined, h.id)} className="cursor-pointer text-muted opacity-0 transition hover:text-fg group-hover:opacity-100" aria-label={`Edit ${h.name}`}>
                            <Pencil className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                      {days.map((d) => {
                        const iso = toISODate(d)
                        const done = h.log.includes(iso)
                        return (
                          <td key={iso} className="text-center">
                            <button
                              onClick={() => toggleHabit(h.id, iso)}
                              aria-label={`${h.name} on ${iso}`}
                              aria-pressed={done}
                              className={cn('h-6 w-6 cursor-pointer rounded-md transition hover:scale-110', !done && 'bg-surface-2 hover:bg-line', isToday(d) && !done && 'ring-1 ring-accent/50')}
                              style={done ? { background: h.color } : undefined}
                            />
                          </td>
                        )
                      })}
                      <td className="text-right">
                        <span className={cn('inline-flex items-center gap-1 text-sm font-semibold', s > 0 ? 'text-orange-500' : 'text-muted')}>
                          <Flame className="h-3.5 w-3.5" /> {s}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  )
}
