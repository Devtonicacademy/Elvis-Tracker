export type ID = string

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done'
export type Priority = 'low' | 'medium' | 'high' | 'urgent'
export type Horizon = 'next' | 'later'

export interface Subtask {
  id: ID
  title: string
  done: boolean
}

export interface Task {
  id: ID
  title: string
  notes: string
  status: TaskStatus
  priority: Priority
  horizon: Horizon
  projectId: ID | null
  dueDate: string | null // yyyy-MM-dd
  startTime: string | null // HH:mm, places the task on the day timeline
  estimate: number | null // minutes
  tags: string[]
  subtasks: Subtask[]
  order: number
  createdAt: string
  completedAt: string | null
}

export type ProjectStatus = 'active' | 'paused' | 'done'

export interface Project {
  id: ID
  name: string
  description: string
  color: string
  status: ProjectStatus
  budget: number
  deadline: string | null
  createdAt: string
}

export type AppStatus = 'idea' | 'building' | 'live' | 'paused'
export type Billing = 'free' | 'monthly' | 'yearly' | 'one_time'

export interface AppItem {
  id: ID
  name: string
  url: string
  category: string
  status: AppStatus
  billing: Billing
  cost: number
  renewalDate: string | null
  projectId: ID | null
  notes: string
  createdAt: string
}

export interface Expense {
  id: ID
  title: string
  amount: number
  category: string
  projectId: ID | null
  date: string
  notes: string
  createdAt: string
}

export interface Habit {
  id: ID
  name: string
  color: string
  log: string[] // yyyy-MM-dd dates the habit was done
  createdAt: string
}

/** Weekly reflection, keyed by the Monday of the week (yyyy-MM-dd). */
export interface Reflection {
  id: ID
  win: string
  slowed: string
  focus: string
}

export interface Settings {
  currency: string
  monthlyBudget: number
  name: string
}

export interface Collections {
  tasks: Task
  projects: Project
  apps: AppItem
  expenses: Expense
  habits: Habit
  reflections: Reflection
}

export type CollectionName = keyof Collections

export const EXPENSE_CATEGORIES = [
  'Software',
  'Hosting',
  'Marketing',
  'Design',
  'Contractors',
  'Hardware',
  'Travel',
  'Food',
  'Other',
] as const

export const PROJECT_COLORS = [
  '#8b5cf6',
  '#6366f1',
  '#0ea5e9',
  '#14b8a6',
  '#22c55e',
  '#f59e0b',
  '#f97316',
  '#ef4444',
  '#ec4899',
]
