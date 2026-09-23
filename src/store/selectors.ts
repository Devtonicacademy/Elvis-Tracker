import { useMemo } from 'react'
import type { Project, Task } from '@/data/types'
import { PRIORITY_META } from '@/data/meta'
import { todayISO } from '@/lib/utils'
import { useData } from './data'

export function useProjectMap() {
  const projects = useData((s) => s.projects)
  return useMemo(() => new Map<string, Project>(projects.map((p) => [p.id, p])), [projects])
}

/** Lower is more urgent: overdue first, then priority, then soonest due date. */
export function focusScore(t: Task, today = todayISO()) {
  let score = PRIORITY_META[t.priority].rank * 10
  if (t.status === 'in_progress') score -= 25
  if (t.dueDate) {
    if (t.dueDate < today) score -= 40
    else if (t.dueDate === today) score -= 30
    else score += Math.min(30, (Date.parse(t.dueDate) - Date.parse(today)) / 86_400_000)
  } else score += 35
  if (t.horizon === 'later') score += 50
  return score
}

export const byFocus = (a: Task, b: Task) => focusScore(a) - focusScore(b)
