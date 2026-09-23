import { Search } from 'lucide-react'
import { PRIORITY_META } from '@/data/meta'
import { Select } from '@/components/ui'
import type { Filters } from './filters'
import { useData } from '@/store/data'

export function TaskFilters({ value, onChange, hideProject }: { value: Filters; onChange: (f: Filters) => void; hideProject?: boolean }) {
  const projects = useData((s) => s.projects)
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          value={value.q}
          onChange={(e) => onChange({ ...value, q: e.target.value })}
          placeholder="Filter tasks…"
          className="h-9 w-48 rounded-xl border border-line bg-surface pl-9 pr-3 text-sm outline-none focus:border-accent"
        />
      </div>
      {!hideProject && (
        <Select value={value.projectId} onChange={(e) => onChange({ ...value, projectId: e.target.value })} className="h-9 w-auto">
          <option value="">All projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
      )}
      <Select value={value.priority} onChange={(e) => onChange({ ...value, priority: e.target.value })} className="h-9 w-auto">
        <option value="">Any priority</option>
        {Object.entries(PRIORITY_META).map(([k, m]) => (
          <option key={k} value={k}>
            {m.label}
          </option>
        ))}
      </Select>
    </div>
  )
}
