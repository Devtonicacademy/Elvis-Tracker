import { format, isToday, isYesterday, parseISO } from 'date-fns'
import { BookCheck, Columns3, List, Plus, Target } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { TaskRow } from '@/components/task-bits'
import { Button, EmptyState, PageHeader, Segmented } from '@/components/ui'
import type { Task } from '@/data/types'
import { useData } from '@/store/data'
import { byFocus, useProjectMap } from '@/store/selectors'
import { useUI } from '@/store/ui'
import { Board } from './Board'
import { applyFilters, emptyFilters } from './filters'
import { TaskFilters } from './TaskFilters'
import { GroupedTaskList } from './TaskList'

type View = 'list' | 'board' | 'next' | 'logbook'

export function TasksPage() {
  const tasks = useData((s) => s.tasks)
  const openQuick = useUI((s) => s.openQuick)
  const [params, setParams] = useSearchParams()
  const view = (params.get('view') as View) || 'list'
  const [filters, setFilters] = useState(emptyFilters)
  const filtered = applyFilters(tasks, filters)
  const openCount = tasks.filter((t) => t.status !== 'done').length

  return (
    <>
      <PageHeader
        title="Tasks"
        subtitle={`${openCount} open · ${tasks.length - openCount} completed`}
        actions={
          <Button variant="primary" onClick={() => openQuick('task')}>
            <Plus className="h-4 w-4" /> Add task
          </Button>
        }
      />
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Segmented<View>
          value={view}
          onChange={(v) => setParams({ view: v })}
          options={[
            { value: 'list', label: <><List className="h-3.5 w-3.5" /> List</> },
            { value: 'board', label: <><Columns3 className="h-3.5 w-3.5" /> Board</> },
            { value: 'next', label: <><Target className="h-3.5 w-3.5" /> Next up</> },
            { value: 'logbook', label: <><BookCheck className="h-3.5 w-3.5" /> Logbook</> },
          ]}
        />
        <TaskFilters value={filters} onChange={setFilters} />
      </div>

      {view === 'list' && <div className="card p-3 sm:p-4"><GroupedTaskList tasks={filtered} /></div>}
      {view === 'board' && <Board tasks={filtered} />}
      {view === 'next' && <NextUp tasks={filtered} />}
      {view === 'logbook' && <Logbook tasks={filtered} />}
    </>
  )
}

function NextUp({ tasks }: { tasks: Task[] }) {
  const projects = useProjectMap()
  const next = tasks.filter((t) => t.status !== 'done').sort(byFocus).slice(0, 12)
  if (!next.length) return <EmptyState icon={<Target className="h-5 w-5" />} title="All clear" hint="Nothing left to work on. Enjoy the calm." />
  const [first, ...rest] = next
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
      <div className="card relative overflow-hidden p-6">
        <div className="bg-brand pointer-events-none absolute inset-0 opacity-[0.08]" />
        <div className="text-xs font-semibold uppercase tracking-wider text-accent">Work on this next</div>
        <div className="-mx-3 mt-3">
          <TaskRow task={first} project={first.projectId ? projects.get(first.projectId) : undefined} />
        </div>
        <p className="mt-4 text-sm text-muted">Picked by due date, priority and what you've already started.</p>
      </div>
      <div className="card p-3">
        <div className="px-3 pb-2 pt-1 text-sm font-semibold">Then</div>
        {rest.map((t) => (
          <TaskRow key={t.id} task={t} project={t.projectId ? projects.get(t.projectId) : undefined} />
        ))}
      </div>
    </div>
  )
}

function Logbook({ tasks }: { tasks: Task[] }) {
  const projects = useProjectMap()
  const done = tasks.filter((t) => t.status === 'done' && t.completedAt).sort((a, b) => b.completedAt!.localeCompare(a.completedAt!))
  if (!done.length) return <EmptyState icon={<BookCheck className="h-5 w-5" />} title="No completed tasks yet" hint="Finished tasks show up here, grouped by day." />
  const groups = new Map<string, Task[]>()
  for (const t of done) {
    const key = t.completedAt!.slice(0, 10)
    groups.set(key, [...(groups.get(key) ?? []), t])
  }
  const label = (d: string) => {
    const date = parseISO(d)
    return isToday(date) ? 'Today' : isYesterday(date) ? 'Yesterday' : format(date, 'EEEE, MMM d')
  }
  return (
    <div className="space-y-4">
      {[...groups].map(([day, list]) => (
        <div key={day} className="card p-3">
          <div className="flex items-center justify-between px-3 pb-1 pt-1">
            <span className="text-sm font-semibold">{label(day)}</span>
            <span className="text-xs text-muted">{list.length} done</span>
          </div>
          {list.map((t) => (
            <TaskRow key={t.id} task={t} project={t.projectId ? projects.get(t.projectId) : undefined} />
          ))}
        </div>
      ))}
    </div>
  )
}
