import { CalendarDays, FolderKanban, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge, Button, EmptyState, PageHeader, Progress, Ring } from '@/components/ui'
import { budgetTone, daysUntil, formatMoney, relativeDue } from '@/lib/utils'
import { useData } from '@/store/data'
import { useUI } from '@/store/ui'

export function ProjectsPage() {
  const { projects, tasks, expenses, settings } = useData()
  const openQuick = useUI((s) => s.openQuick)

  return (
    <>
      <PageHeader
        title="Projects"
        subtitle={`${projects.filter((p) => p.status === 'active').length} active projects`}
        actions={
          <Button variant="primary" onClick={() => openQuick('project')}>
            <Plus className="h-4 w-4" /> New project
          </Button>
        }
      />
      {projects.length === 0 ? (
        <EmptyState icon={<FolderKanban className="h-5 w-5" />} title="No projects yet" hint="Group tasks, apps and expenses into projects." action={<Button onClick={() => openQuick('project')}>Create project</Button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((p) => {
            const pt = tasks.filter((t) => t.projectId === p.id)
            const done = pt.filter((t) => t.status === 'done').length
            const pct = pt.length ? Math.round((done / pt.length) * 100) : 0
            const spent = expenses.filter((e) => e.projectId === p.id).reduce((s, e) => s + e.amount, 0)
            const bpct = p.budget ? (spent / p.budget) * 100 : 0
            return (
              <Link key={p.id} to={`/projects/${p.id}`} className="card group relative overflow-hidden p-5 transition hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-xl">
                <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-25 blur-2xl transition group-hover:opacity-40" style={{ background: p.color }} />
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ background: p.color }} />
                      <h3 className="truncate font-semibold">{p.name}</h3>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-muted">{p.description || 'No description'}</p>
                  </div>
                  <Ring value={pct} size={52} stroke={5} color={p.color}>{pct}%</Ring>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted">
                  <span>{done}/{pt.length} tasks</span>
                  {p.deadline && (
                    <span className={`inline-flex items-center gap-1 ${daysUntil(p.deadline) < 0 ? 'text-red-500' : ''}`}>
                      · <CalendarDays className="h-3 w-3" /> {relativeDue(p.deadline)}
                    </span>
                  )}
                  {p.status !== 'active' && <Badge>{p.status}</Badge>}
                </div>
                {p.budget > 0 && (
                  <div className="mt-4">
                    <div className="mb-1.5 flex justify-between text-xs">
                      <span className="text-muted">Budget</span>
                      <span>
                        {formatMoney(spent, settings.currency)} <span className="text-muted">/ {formatMoney(p.budget, settings.currency)}</span>
                      </span>
                    </div>
                    <Progress value={bpct} color={budgetTone(bpct)} />
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </>
  )
}
