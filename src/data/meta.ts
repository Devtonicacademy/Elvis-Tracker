import type { Priority, TaskStatus } from './types'

export const PRIORITY_META: Record<Priority, { label: string; color: string; rank: number }> = {
  urgent: { label: 'Urgent', color: '#ef4444', rank: 0 },
  high: { label: 'High', color: '#f97316', rank: 1 },
  medium: { label: 'Medium', color: '#eab308', rank: 2 },
  low: { label: 'Low', color: '#3b82f6', rank: 3 },
}

export const STATUS_META: Record<TaskStatus, { label: string; color: string }> = {
  todo: { label: 'To do', color: '#8e8ea6' },
  in_progress: { label: 'In progress', color: '#8b5cf6' },
  review: { label: 'Review', color: '#f59e0b' },
  done: { label: 'Done', color: '#22c55e' },
}
