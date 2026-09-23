import { useEffect, useState } from 'react'
import type { Task } from '@/data/types'
import { useProjectMap } from '@/store/selectors'
import { useUI } from '@/store/ui'
import { cn, todayISO } from '@/lib/utils'

const START = 7
const END = 22
const HOUR_PX = 56

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

/** Time-blocked schedule for one day: tasks with a start time become blocks. */
export function DayTimeline({ tasks, date = todayISO() }: { tasks: Task[]; date?: string }) {
  const projects = useProjectMap()
  const { openTask, openQuick } = useUI()
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  const blocks = tasks.filter((t) => t.startTime && t.dueDate === date)
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const showNow = date === todayISO() && nowMin >= START * 60 && nowMin <= END * 60

  return (
    <div className="relative" style={{ height: (END - START) * HOUR_PX }}>
      {Array.from({ length: END - START }, (_, i) => START + i).map((h) => (
        <button
          key={h}
          onClick={() => openQuick('task', { dueDate: date, startTime: `${String(h).padStart(2, '0')}:00` })}
          className="group absolute left-0 right-0 flex cursor-pointer border-t border-line/70 text-left"
          style={{ top: (h - START) * HOUR_PX, height: HOUR_PX }}
          aria-label={`Add task at ${h}:00`}
        >
          <span className="w-12 shrink-0 -translate-y-2 bg-surface pr-2 text-right text-[11px] text-muted">
            {h === 12 ? '12pm' : h > 12 ? `${h - 12}pm` : `${h}am`}
          </span>
          <span className="flex-1 rounded-lg opacity-0 transition group-hover:bg-surface-2/60 group-hover:opacity-100" />
        </button>
      ))}

      {blocks.map((t) => {
        const start = toMin(t.startTime!)
        const top = ((start - START * 60) / 60) * HOUR_PX
        const height = Math.max(26, ((t.estimate ?? 30) / 60) * HOUR_PX - 3)
        const color = (t.projectId && projects.get(t.projectId)?.color) || '#8b5cf6'
        const done = t.status === 'done'
        return (
          <button
            key={t.id}
            onClick={() => openTask(t.id)}
            className={cn('absolute left-14 right-1 cursor-pointer overflow-hidden rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-white shadow-md transition hover:brightness-110', done && 'opacity-50 line-through')}
            style={{ top: Math.max(0, top) + 1, height, background: color }}
          >
            <div className="truncate">{t.title}</div>
            {height > 40 && <div className="mt-0.5 text-[10px] opacity-80">{t.startTime}{t.estimate ? ` · ${t.estimate}m` : ''}</div>}
          </button>
        )
      })}

      {showNow && (
        <div className="pointer-events-none absolute left-11 right-0 z-10 flex items-center" style={{ top: ((nowMin - START * 60) / 60) * HOUR_PX }}>
          <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
          <span className="h-px flex-1 bg-red-500" />
        </div>
      )}
    </div>
  )
}
