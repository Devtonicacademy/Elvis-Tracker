import type { Task } from '@/data/types'

export interface Filters {
  q: string
  projectId: string
  priority: string
}

export const emptyFilters: Filters = { q: '', projectId: '', priority: '' }

export function applyFilters(tasks: Task[], f: Filters) {
  const q = f.q.trim().toLowerCase()
  return tasks.filter(
    (t) =>
      (!f.projectId || t.projectId === f.projectId) &&
      (!f.priority || t.priority === f.priority) &&
      (!q || t.title.toLowerCase().includes(q) || t.tags.some((tag) => tag.includes(q))),
  )
}
