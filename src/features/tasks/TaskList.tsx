import { ChevronRight, Plus } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { TaskRow } from '@/components/task-bits'
import type { Task } from '@/data/types'
import { cn } from '@/lib/utils'
import { byFocus, useProjectMap } from '@/store/selectors'
import { useUI } from '@/store/ui'

function Group({
  title,
  tasks,
  onAdd,
  collapsible,
  defaultOpen = true,
  showProject,
  accent,
}: {
  title: string
  tasks: Task[]
  onAdd?: () => void
  collapsible?: boolean
  defaultOpen?: boolean
  showProject?: boolean
  accent?: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  const projects = useProjectMap()
  if (!tasks.length && !onAdd) return null
  return (
    <section className="mb-6">
      <div className="mb-1 flex items-center gap-2 px-3">
        <button
          onClick={() => collapsible && setOpen(!open)}
          className={cn('flex items-center gap-2 text-lg font-semibold tracking-tight', collapsible && 'cursor-pointer')}
        >
          {collapsible && <ChevronRight className={cn('h-4 w-4 text-muted transition', open && 'rotate-90')} />}
          {accent}
          {title}
        </button>
        <span className="text-sm text-muted">{tasks.length}</span>
        {onAdd && (
          <button onClick={onAdd} className="ml-auto cursor-pointer rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-fg" aria-label={`Add to ${title}`}>
            <Plus className="h-4 w-4" />
          </button>
        )}
      </div>
      {open && (
        <div className="divide-y divide-line/60">
          {tasks.map((t) => (
            <TaskRow key={t.id} task={t} project={t.projectId ? projects.get(t.projectId) : undefined} showProject={showProject} />
          ))}
          {!tasks.length && <p className="px-3 py-3 text-sm text-muted">Nothing here yet.</p>}
        </div>
      )}
    </section>
  )
}

const dot = (c: string) => <span className="h-2 w-2 rounded-full" style={{ background: c }} />

/** Mindset-Stack-style list: in progress → review → next → later → done. */
export function GroupedTaskList({ tasks, projectId, showProject = true }: { tasks: Task[]; projectId?: string; showProject?: boolean }) {
  const openQuick = useUI((s) => s.openQuick)
  const add = (defaults: Record<string, unknown>) => () => openQuick('task', { projectId, ...defaults })
  const open = tasks.filter((t) => t.status !== 'done').sort(byFocus)
  const done = tasks
    .filter((t) => t.status === 'done')
    .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))

  return (
    <div>
      <Group title="In progress" accent={dot('#8b5cf6')} tasks={open.filter((t) => t.status === 'in_progress')} onAdd={add({ status: 'in_progress' })} showProject={showProject} />
      <Group title="Review" accent={dot('#f59e0b')} tasks={open.filter((t) => t.status === 'review')} showProject={showProject} />
      <Group title="Next" accent={dot('#0ea5e9')} tasks={open.filter((t) => t.status === 'todo' && t.horizon === 'next')} onAdd={add({ horizon: 'next' })} showProject={showProject} />
      <Group title="Later" accent={dot('#8e8ea6')} tasks={open.filter((t) => t.status === 'todo' && t.horizon === 'later')} onAdd={add({ horizon: 'later' })} collapsible showProject={showProject} />
      <Group title="Done" accent={dot('#22c55e')} tasks={done} collapsible defaultOpen={false} showProject={showProject} />
    </div>
  )
}
