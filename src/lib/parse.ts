import { addDays, format, nextDay, type Day } from 'date-fns'
import type { Priority, Project } from '@/data/types'

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
const dayIndex = (w: string) => DAYS.findIndex((d) => w === d || w === d.slice(0, 3))

export interface ParsedTask {
  title: string
  priority?: Priority
  dueDate?: string
  estimate?: number
  tags: string[]
  projectId?: string
}

/**
 * Quick-add syntax, e.g. "Call designer tomorrow !high #design 30m @website".
 * !urgent/!high/!medium/!low · #tag · today/tomorrow/mon…sun · 30m/2h · @project
 */
export function parseQuickTask(input: string, projects: Project[]): ParsedTask {
  const out: ParsedTask = { title: '', tags: [] }
  const words: string[] = []
  const iso = (d: Date) => format(d, 'yyyy-MM-dd')

  for (const word of input.trim().split(/\s+/)) {
    const lower = word.toLowerCase()
    const prio = lower.match(/^!(urgent|high|medium|low|1|2|3|4)$/)
    const est = lower.match(/^(\d+(?:\.\d+)?)(m|min|h|hr)$/)
    if (prio) {
      const map: Record<string, Priority> = { '1': 'urgent', '2': 'high', '3': 'medium', '4': 'low' }
      out.priority = (map[prio[1]] ?? prio[1]) as Priority
    } else if (lower.startsWith('#') && lower.length > 1) {
      out.tags.push(lower.slice(1))
    } else if (lower.startsWith('@') && lower.length > 1) {
      const q = lower.slice(1)
      const p = projects.find((p) => p.name.toLowerCase().replace(/\s+/g, '').includes(q))
      if (p) out.projectId = p.id
      else words.push(word)
    } else if (lower === 'today') out.dueDate = iso(new Date())
    else if (lower === 'tomorrow' || lower === 'tmr') out.dueDate = iso(addDays(new Date(), 1))
    else if (dayIndex(lower) !== -1) out.dueDate = iso(nextDay(new Date(), dayIndex(lower) as Day))
    else if (est) {
      const n = parseFloat(est[1])
      out.estimate = Math.round(est[2].startsWith('h') ? n * 60 : n)
    } else words.push(word)
  }
  out.title = words.join(' ')
  return out
}
