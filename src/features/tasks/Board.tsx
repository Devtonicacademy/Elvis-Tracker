import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ListChecks, Plus } from 'lucide-react'
import { useState } from 'react'
import { STATUS_META } from '@/data/meta'
import { DueChip, PriorityIcon } from '@/components/task-bits'
import { Badge, Checkbox } from '@/components/ui'
import type { Project, Task, TaskStatus } from '@/data/types'
import { cn, formatMinutes } from '@/lib/utils'
import { useData } from '@/store/data'
import { useProjectMap } from '@/store/selectors'
import { useUI } from '@/store/ui'

const COLUMNS: TaskStatus[] = ['todo', 'in_progress', 'review', 'done']

function Card({ task, project, overlay }: { task: Task; project?: Project; overlay?: boolean }) {
  const toggleTask = useData((s) => s.toggleTask)
  const openTask = useUI((s) => s.openTask)
  const done = task.status === 'done'
  const subDone = task.subtasks.filter((s) => s.done).length
  return (
    <div
      onClick={() => openTask(task.id)}
      className={cn(
        'card cursor-grab rounded-2xl p-3.5 transition hover:border-accent/40 active:cursor-grabbing',
        overlay && 'rotate-2 shadow-2xl ring-2 ring-accent/40',
      )}
    >
      {project && (
        <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-muted">
          <span className="h-2 w-2 rounded-full" style={{ background: project.color }} />
          {project.name}
        </div>
      )}
      <div className="flex items-start gap-2.5">
        <Checkbox checked={done} onChange={() => toggleTask(task.id)} color="#22c55e" className="mt-0.5" />
        <p className={cn('flex-1 text-sm font-medium leading-snug', done && 'text-muted line-through')}>{task.title}</p>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <PriorityIcon priority={task.priority} />
        {task.dueDate && <DueChip date={task.dueDate} done={done} />}
        {task.subtasks.length > 0 && (
          <span className="inline-flex items-center gap-1 text-xs text-muted">
            <ListChecks className="h-3.5 w-3.5" />
            {subDone}/{task.subtasks.length}
          </span>
        )}
        {task.estimate && <Badge color="#60a5fa">{formatMinutes(task.estimate)}</Badge>}
        {task.tags.slice(0, 2).map((t) => (
          <Badge key={t}>{t}</Badge>
        ))}
      </div>
    </div>
  )
}

function SortableCard({ task, project }: { task: Task; project?: Project }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id, data: { status: task.status } })
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={cn(isDragging && 'opacity-30')} {...attributes} {...listeners}>
      <Card task={task} project={project} />
    </div>
  )
}

function Column({ status, tasks, projectId }: { status: TaskStatus; tasks: Task[]; projectId?: string }) {
  const { setNodeRef, isOver } = useDroppable({ id: `col:${status}`, data: { status } })
  const projects = useProjectMap()
  const openQuick = useUI((s) => s.openQuick)
  const meta = STATUS_META[status]
  return (
    <div className="flex w-[290px] shrink-0 flex-col sm:w-auto sm:min-w-0 sm:flex-1">
      <div className="mb-3 flex items-center gap-2 px-1">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: meta.color }} />
        <span className="text-sm font-semibold">{meta.label}</span>
        <span className="rounded-md bg-surface-2 px-1.5 text-xs text-muted">{tasks.length}</span>
        <button onClick={() => openQuick('task', { status, projectId })} className="ml-auto cursor-pointer rounded-lg p-1 text-muted hover:bg-surface-2 hover:text-fg" aria-label={`Add to ${meta.label}`}>
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <div
        ref={setNodeRef}
        className={cn('flex min-h-40 flex-1 flex-col gap-2.5 rounded-2xl border border-dashed p-2 transition', isOver ? 'border-accent/60 bg-accent/5' : 'border-transparent bg-surface-2/30')}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((t) => (
            <SortableCard key={t.id} task={t} project={t.projectId ? projects.get(t.projectId) : undefined} />
          ))}
        </SortableContext>
      </div>
    </div>
  )
}

export function Board({ tasks, projectId }: { tasks: Task[]; projectId?: string }) {
  const moveTask = useData((s) => s.moveTask)
  const projects = useProjectMap()
  const [activeId, setActiveId] = useState<string | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const byStatus = (s: TaskStatus) => tasks.filter((t) => t.status === s).sort((a, b) => a.order - b.order)
  const active = tasks.find((t) => t.id === activeId)

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null)
    if (!over) return
    const overId = String(over.id)
    if (overId === active.id) return
    const status = over.data.current?.status as TaskStatus | undefined
    if (!status) return
    moveTask(String(active.id), status, overId.startsWith('col:') ? null : overId)
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={(e) => setActiveId(String(e.active.id))} onDragEnd={onDragEnd} onDragCancel={() => setActiveId(null)}>
      <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0">
        {COLUMNS.map((s) => (
          <Column key={s} status={s} tasks={byStatus(s)} projectId={projectId} />
        ))}
      </div>
      <DragOverlay>{active && <Card task={active} project={active.projectId ? projects.get(active.projectId) : undefined} overlay />}</DragOverlay>
    </DndContext>
  )
}
