import { Boxes, CalendarClock, ExternalLink, Plus, Repeat, Rocket } from 'lucide-react'
import { useState } from 'react'
import { Badge, Button, EmptyState, PageHeader, Segmented, StatCard } from '@/components/ui'
import type { AppItem, AppStatus } from '@/data/types'
import { cn, daysUntil, formatMoney, monthlyCost, relativeDue } from '@/lib/utils'
import { useData } from '@/store/data'
import { useProjectMap } from '@/store/selectors'
import { useUI } from '@/store/ui'

const APP_STATUS: Record<AppStatus, { label: string; color: string; emoji: string }> = {
  idea: { label: 'Idea', color: '#eab308', emoji: '💡' },
  building: { label: 'Building', color: '#8b5cf6', emoji: '🛠' },
  live: { label: 'Live', color: '#22c55e', emoji: '🟢' },
  paused: { label: 'Paused', color: '#8e8ea6', emoji: '⏸' },
}

const BILLING_LABEL = { free: 'Free', monthly: '/mo', yearly: '/yr', one_time: 'one-time' }

function AppCard({ app }: { app: AppItem }) {
  const openQuick = useUI((s) => s.openQuick)
  const project = useProjectMap().get(app.projectId ?? '')
  const currency = useData((s) => s.settings.currency)
  const status = APP_STATUS[app.status]
  const renewIn = app.renewalDate ? daysUntil(app.renewalDate) : null
  const hue = [...app.name].reduce((h, c) => h + c.charCodeAt(0), 0) % 360

  return (
    <div onClick={() => openQuick('app', undefined, app.id)} className="card group flex cursor-pointer flex-col p-5 transition hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-xl">
      <div className="flex items-start gap-3">
        <div
          className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-lg font-bold text-white shadow-md"
          style={{ background: `linear-gradient(135deg, hsl(${hue} 70% 55%), hsl(${(hue + 40) % 360} 70% 45%))` }}
        >
          {app.name[0]?.toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-semibold">{app.name}</span>
            {app.url && (
              <a href={app.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-muted hover:text-accent" aria-label={`Open ${app.name}`}>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
          <div className="text-xs text-muted">{app.category}</div>
        </div>
        <Badge color={status.color}>{status.label}</Badge>
      </div>

      {app.notes && <p className="mt-3 line-clamp-2 text-sm text-muted">{app.notes}</p>}

      <div className="mt-auto flex items-end justify-between gap-2 pt-4">
        <div>
          <span className="text-xl font-bold">{app.billing === 'free' ? 'Free' : formatMoney(app.cost, currency)}</span>
          {app.billing !== 'free' && <span className="ml-1 text-xs text-muted">{BILLING_LABEL[app.billing]}</span>}
        </div>
        <div className="flex flex-col items-end gap-1 text-xs">
          {renewIn !== null && (
            <span className={cn('inline-flex items-center gap-1', renewIn < 0 ? 'text-red-500' : renewIn <= 7 ? 'text-amber-500' : 'text-muted')}>
              <CalendarClock className="h-3 w-3" /> Renews {relativeDue(app.renewalDate!).toLowerCase()}
            </span>
          )}
          {project && (
            <span className="inline-flex items-center gap-1 text-muted">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: project.color }} /> {project.name}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export function AppsPage() {
  const apps = useData((s) => s.apps)
  const currency = useData((s) => s.settings.currency)
  const openQuick = useUI((s) => s.openQuick)
  const [filter, setFilter] = useState<'all' | AppStatus>('all')

  const active = apps.filter((a) => a.status !== 'paused')
  const monthly = active.reduce((s, a) => s + monthlyCost(a.cost, a.billing), 0)
  const upcoming = apps.filter((a) => a.renewalDate && daysUntil(a.renewalDate) >= 0 && daysUntil(a.renewalDate) <= 14)
  const shown = filter === 'all' ? apps : apps.filter((a) => a.status === filter)
  const count = (s: AppStatus) => apps.filter((a) => a.status === s).length

  return (
    <>
      <PageHeader
        title="Apps"
        subtitle="Your products in the works and the tools you pay for, all in one place."
        actions={
          <Button variant="primary" onClick={() => openQuick('app')}>
            <Plus className="h-4 w-4" /> Add app
          </Button>
        }
      />
      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Tracked apps" value={apps.length} hint={`${count('live')} live · ${count('building')} building`} icon={<Boxes className="h-4 w-4" />} />
        <StatCard label="Monthly cost" value={formatMoney(monthly, currency)} hint="Active subscriptions" icon={<Repeat className="h-4 w-4" />} tone="#0ea5e9" />
        <StatCard label="Yearly cost" value={formatMoney(monthly * 12, currency)} hint="Projected" icon={<Repeat className="h-4 w-4" />} tone="#f59e0b" />
        <StatCard label="Renewing soon" value={upcoming.length} hint="Next 14 days" icon={<CalendarClock className="h-4 w-4" />} tone="#ef4444" />
      </div>

      <div className="mb-5">
        <Segmented
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: `All ${apps.length}` },
            ...(Object.keys(APP_STATUS) as AppStatus[]).map((s) => ({ value: s, label: `${APP_STATUS[s].label} ${count(s)}` })),
          ]}
        />
      </div>

      {shown.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((a) => (
            <AppCard key={a.id} app={a} />
          ))}
        </div>
      ) : (
        <EmptyState icon={<Rocket className="h-5 w-5" />} title="No apps here" hint="Track an app you're building or a subscription you pay for." action={<Button onClick={() => openQuick('app')}>Add app</Button>} />
      )}
    </>
  )
}
