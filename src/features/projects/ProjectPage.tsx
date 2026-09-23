import { ArrowLeft, Boxes, CheckSquare, Columns3, List, Pencil, Plus, Receipt, Wallet } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Badge, Button, EmptyState, PageHeader, Progress, Segmented, StatCard } from '@/components/ui'
import { budgetTone, formatMoney, relativeDue } from '@/lib/utils'
import { useData } from '@/store/data'
import { useUI } from '@/store/ui'
import { Board } from '../tasks/Board'
import { GroupedTaskList } from '../tasks/TaskList'

export function ProjectPage() {
  const { id } = useParams()
  const { projects, tasks, expenses, apps, settings } = useData()
  const openQuick = useUI((s) => s.openQuick)
  const [view, setView] = useState<'list' | 'board'>('list')
  const project = projects.find((p) => p.id === id)

  if (!project)
    return (
      <EmptyState icon={<CheckSquare className="h-5 w-5" />} title="Project not found" action={<Link to="/projects" className="text-sm text-accent">Back to projects</Link>} />
    )

  const money = (v: number) => formatMoney(v, settings.currency)
  const pt = tasks.filter((t) => t.projectId === project.id)
  const done = pt.filter((t) => t.status === 'done').length
  const pe = expenses.filter((e) => e.projectId === project.id).sort((a, b) => b.date.localeCompare(a.date))
  const spent = pe.reduce((s, e) => s + e.amount, 0)
  const pa = apps.filter((a) => a.projectId === project.id)
  const bpct = project.budget ? (spent / project.budget) * 100 : 0

  return (
    <>
      <Link to="/projects" className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
        <ArrowLeft className="h-4 w-4" /> Projects
      </Link>
      <PageHeader
        title={project.name}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: project.color }} />
            {project.description || 'No description'}
            {project.deadline && <Badge color={project.color}>Due {relativeDue(project.deadline).toLowerCase()}</Badge>}
          </span>
        }
        actions={
          <>
            <Button onClick={() => openQuick('project', undefined, project.id)}>
              <Pencil className="h-4 w-4" /> Edit
            </Button>
            <Button onClick={() => openQuick('expense', { projectId: project.id })}>
              <Receipt className="h-4 w-4" /> Expense
            </Button>
            <Button variant="primary" onClick={() => openQuick('task', { projectId: project.id })}>
              <Plus className="h-4 w-4" /> Task
            </Button>
          </>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Progress" value={`${pt.length ? Math.round((done / pt.length) * 100) : 0}%`} hint={`${done} of ${pt.length} tasks done`} icon={<CheckSquare className="h-4 w-4" />} tone={project.color} />
        <StatCard label="Spent" value={money(spent)} hint={`${pe.length} expenses`} icon={<Receipt className="h-4 w-4" />} tone="#f59e0b" />
        <StatCard
          label="Budget"
          value={project.budget ? money(project.budget) : '—'}
          hint={project.budget ? <Progress value={bpct} color={budgetTone(bpct)} className="mt-1" /> : 'No budget set'}
          icon={<Wallet className="h-4 w-4" />}
          tone="#0ea5e9"
        />
        <StatCard label="Apps" value={pa.length} hint={pa.map((a) => a.name).join(', ') || 'None linked'} icon={<Boxes className="h-4 w-4" />} tone="#22c55e" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <div>
          <div className="mb-3 flex justify-between">
            <h2 className="text-lg font-semibold">Tasks</h2>
            <Segmented
              value={view}
              onChange={setView}
              options={[
                { value: 'list', label: <><List className="h-3.5 w-3.5" /> List</> },
                { value: 'board', label: <><Columns3 className="h-3.5 w-3.5" /> Board</> },
              ]}
            />
          </div>
          {view === 'list' ? (
            <div className="card p-3 sm:p-4">
              <GroupedTaskList tasks={pt} projectId={project.id} showProject={false} />
            </div>
          ) : (
            <Board tasks={pt} projectId={project.id} />
          )}
        </div>
        <div className="card h-fit p-4">
          <div className="mb-2 flex items-center justify-between px-1">
            <h2 className="text-sm font-semibold">Recent expenses</h2>
            <span className="text-xs text-muted">{money(spent)} total</span>
          </div>
          {pe.length ? (
            pe.slice(0, 8).map((e) => (
              <button key={e.id} onClick={() => openQuick('expense', undefined, e.id)} className="flex w-full cursor-pointer items-center justify-between rounded-lg px-2 py-2 text-left text-sm hover:bg-surface-2">
                <span className="min-w-0">
                  <span className="block truncate">{e.title}</span>
                  <span className="text-xs text-muted">{e.category} · {e.date}</span>
                </span>
                <span className="font-medium">{money(e.amount)}</span>
              </button>
            ))
          ) : (
            <p className="px-1 py-4 text-sm text-muted">No expenses yet.</p>
          )}
        </div>
      </div>
    </>
  )
}
