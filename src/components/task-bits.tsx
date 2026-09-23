import { format, parseISO } from 'date-fns'
import { ChevronDown, ChevronsUp, ChevronUp, Equal, ListChecks, CalendarDays } from 'lucide-react'
import { PRIORITY_META } from '@/data/meta'
import type { Priority, Project, Task } from '@/data/types'
import { cn, daysUntil, formatMinutes, relativeDue } from '@/lib/utils'
import { useData } from '@/store/data'
import { useUI } from '@/store/ui'
import { Badge, Checkbox } from './ui'

export function PriorityIcon({ priority, className }: { priority: Priority; className?: string }) {
  const color = PRIORITY_META[priority].color
  const props = { className: cn('h-4 w-4 shrink-0', className), style: { color }, strokeWidth: 2.5 }
  if (priority === 'urgent') return <ChevronsUp {...props} />
  if (priority === 'high') return <ChevronUp {...props} />
  if (priority === 'low') return <ChevronDown {...props} />
  return <Equal {...props} />
}

export function DueChip({ date, done }: { date: string; done?: boolean }) {
  const diff = daysUntil(date)
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs',
        done ? 'text-muted' : diff < 0 ? 'text-red-500' : diff === 0 ? 'text-amber-500' : 'text-muted',
      )}
    >
      <CalendarDays className="h-3 w-3" />
      {done ? format(parseISO(date), 'MMM d') : relativeDue(date)}
    </span>
  )
}

export function TaskRow({ task, project, showProject = true }: { task: Task; project?: Project; showProject?: boolean }) {
  const toggleTask = useData((s) => s.toggleTask)
  const openTask = useUI((s) => s.openTask)
  const done = task.status === 'done'
  const subDone = task.subtasks.filter((s) => s.done).length

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => openTask(task.id)}
      onKeyDown={(e) => e.key === 'Enter' && openTask(task.id)}
      className="group flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-surface-2/70"
    >
      <Checkbox checked={done} onChange={() => toggleTask(task.id)} color="#22c55e" />
      <PriorityIcon priority={task.priority} className={done ? 'opacity-40' : ''} />
      <span className={cn('min-w-0 flex-1 truncate text-sm', done && 'text-muted line-through')}>{task.title}</span>
      <div className="flex shrink-0 items-center gap-2">
        {task.subtasks.length > 0 && (
          <span className="hidden items-center gap-1 text-xs text-muted sm:inline-flex">
            <ListChecks className="h-3.5 w-3.5" />
            {subDone}/{task.subtasks.length}
          </span>
        )}
        {task.dueDate && <DueChip date={task.dueDate} done={done} />}
        {task.estimate && (
          <Badge color="#60a5fa" className="hidden  sm:inline-flex">{formatMinutes(task.estimate)}</Badge>
        )}
        {task.tags.slice(0, 2).map((t) => (
          <Badge key={t} className="hidden md:inline-flex">
            {t}
          </Badge>
        ))}
        {showProject && project && (
          <span className="hidden h-2 w-2 rounded-full sm:inline-block" style={{ background: project.color }} title={project.name} />
        )}
      </div>
    </div>
  )
}
