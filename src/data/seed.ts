import { addDays, format, startOfMonth, subDays, subMonths } from 'date-fns'
import type { AppItem, Expense, Habit, Project, Task } from './types'

const d = (offset: number) => format(addDays(new Date(), offset), 'yyyy-MM-dd')
const now = new Date().toISOString()

export function buildSeed() {
  const projects: Project[] = [
    { id: 'p-web', name: 'Build new website', description: 'Company site relaunch with new branding.', color: '#8b5cf6', status: 'active', budget: 4000, deadline: d(4), createdAt: now },
    { id: 'p-app', name: 'Mobile app MVP', description: 'Ship the first version to the stores.', color: '#0ea5e9', status: 'active', budget: 9000, deadline: d(21), createdAt: now },
    { id: 'p-mkt', name: 'Q4 marketing', description: 'Content, ads and launch campaign.', color: '#f59e0b', status: 'active', budget: 2500, deadline: d(45), createdAt: now },
    { id: 'p-home', name: 'Personal', description: 'Life admin and errands.', color: '#22c55e', status: 'active', budget: 0, deadline: null, createdAt: now },
  ]

  let order = 0
  const t = (p: Partial<Task> & Pick<Task, 'title'>): Task => ({
    id: `t-${++order}`,
    notes: '',
    status: 'todo',
    priority: 'medium',
    horizon: 'next',
    projectId: null,
    dueDate: null,
    startTime: null,
    estimate: null,
    tags: [],
    subtasks: [],
    order,
    createdAt: now,
    completedAt: null,
    ...p,
  })

  const tasks: Task[] = [
    t({ title: "Define the website's purpose and goals", status: 'in_progress', priority: 'high', projectId: 'p-web', dueDate: d(0), startTime: '14:00', estimate: 120, tags: ['strategy'], subtasks: [{ id: 's1', title: 'Interview 3 customers', done: true }, { id: 's2', title: 'Write positioning doc', done: false }] }),
    t({ title: 'Review daily tasks', status: 'in_progress', priority: 'medium', projectId: 'p-home', dueDate: d(0), startTime: '09:00', estimate: 15 }),
    t({ title: 'Set a budget and timeline for the project', priority: 'urgent', projectId: 'p-web', dueDate: d(1), estimate: 60, tags: ['planning'] }),
    t({ title: 'Design the layout and menu structure', priority: 'high', projectId: 'p-web', dueDate: d(2), estimate: 180, tags: ['design'] }),
    t({ title: 'Select a color scheme and typography', priority: 'medium', projectId: 'p-web', dueDate: d(3), estimate: 90, tags: ['design'] }),
    t({ title: 'Optimize on-page SEO (meta tags, headers)', priority: 'medium', projectId: 'p-web', estimate: 45, tags: ['seo'] }),
    t({ title: 'Set up auth and user profiles', status: 'review', priority: 'high', projectId: 'p-app', dueDate: d(5), estimate: 240, tags: ['backend'] }),
    t({ title: 'Prepare presentation for investors', priority: 'high', projectId: 'p-app', dueDate: d(0), startTime: '16:30', estimate: 90 }),
    t({ title: 'Write launch blog post', priority: 'low', projectId: 'p-mkt', horizon: 'later', estimate: 120, tags: ['content'] }),
    t({ title: 'Plan ad campaign budget', priority: 'medium', projectId: 'p-mkt', horizon: 'later', dueDate: d(10) }),
    t({ title: 'Research competitor pricing', priority: 'low', projectId: 'p-mkt', horizon: 'later' }),
    t({ title: 'Renew car insurance', priority: 'urgent', projectId: 'p-home', dueDate: d(-1) }),
    t({ title: 'Book dentist appointment', priority: 'low', projectId: 'p-home', horizon: 'later' }),
    t({ title: 'Wireframe onboarding screens', status: 'done', priority: 'high', projectId: 'p-app', completedAt: subDays(new Date(), 1).toISOString(), dueDate: d(-1) }),
    t({ title: 'Choose hosting provider', status: 'done', priority: 'medium', projectId: 'p-web', completedAt: subDays(new Date(), 2).toISOString(), dueDate: d(-2) }),
    t({ title: 'Register domain', status: 'done', priority: 'medium', projectId: 'p-web', completedAt: subDays(new Date(), 3).toISOString(), dueDate: d(-3) }),
    t({ title: 'Kickoff call with designer', status: 'done', priority: 'high', projectId: 'p-app', completedAt: subDays(new Date(), 4).toISOString(), dueDate: d(-4) }),
    t({ title: 'Set up analytics', status: 'done', priority: 'low', projectId: 'p-mkt', completedAt: subDays(new Date(), 40).toISOString(), dueDate: d(-40) }),
  ]

  const apps: AppItem[] = [
    { id: 'a1', name: 'Figma', url: 'https://figma.com', category: 'Design', status: 'live', billing: 'monthly', cost: 15, renewalDate: d(6), projectId: 'p-web', notes: '', createdAt: now },
    { id: 'a2', name: 'Vercel', url: 'https://vercel.com', category: 'Hosting', status: 'live', billing: 'monthly', cost: 20, renewalDate: d(12), projectId: 'p-web', notes: '', createdAt: now },
    { id: 'a3', name: 'Notion', url: 'https://notion.so', category: 'Productivity', status: 'live', billing: 'yearly', cost: 96, renewalDate: d(40), projectId: null, notes: '', createdAt: now },
    { id: 'a4', name: 'Habit Coach app', url: '', category: 'My product', status: 'building', billing: 'free', cost: 0, renewalDate: null, projectId: 'p-app', notes: 'Our own mobile app.', createdAt: now },
    { id: 'a5', name: 'Budget buddy', url: '', category: 'My product', status: 'idea', billing: 'free', cost: 0, renewalDate: null, projectId: null, notes: 'Side-project idea.', createdAt: now },
    { id: 'a6', name: 'Mailchimp', url: 'https://mailchimp.com', category: 'Marketing', status: 'paused', billing: 'monthly', cost: 13, renewalDate: d(3), projectId: 'p-mkt', notes: '', createdAt: now },
  ]

  const monthStart = startOfMonth(new Date())
  const e = (id: string, title: string, amount: number, category: string, projectId: string | null, date: Date): Expense => ({
    id, title, amount, category, projectId, date: format(date, 'yyyy-MM-dd'), notes: '', createdAt: now,
  })
  const expenses: Expense[] = [
    e('e1', 'Figma subscription', 15, 'Software', 'p-web', addDays(monthStart, 1)),
    e('e2', 'Freelance designer', 850, 'Contractors', 'p-web', addDays(monthStart, 3)),
    e('e3', 'Vercel Pro', 20, 'Hosting', 'p-web', addDays(monthStart, 4)),
    e('e4', 'Facebook ads', 320, 'Marketing', 'p-mkt', addDays(monthStart, 6)),
    e('e5', 'Team lunch', 64.5, 'Food', null, addDays(monthStart, 8)),
    e('e6', 'Test devices', 410, 'Hardware', 'p-app', addDays(monthStart, 9)),
    e('e7', 'Apple developer', 99, 'Software', 'p-app', subMonths(addDays(monthStart, 5), 1)),
    e('e8', 'Stock photos', 45, 'Design', 'p-web', subMonths(addDays(monthStart, 12), 1)),
    e('e9', 'Google ads', 210, 'Marketing', 'p-mkt', subMonths(addDays(monthStart, 18), 1)),
    e('e10', 'Hosting', 20, 'Hosting', 'p-web', subMonths(addDays(monthStart, 4), 2)),
    e('e11', 'Contract developer', 1200, 'Contractors', 'p-app', subMonths(addDays(monthStart, 14), 2)),
  ]

  const habit = (id: string, name: string, color: string, rate: number): Habit => ({
    id, name, color, createdAt: now,
    log: Array.from({ length: 28 }, (_, i) => i).filter((i) => i > 0 && (i * 7) % 10 < rate * 10).map((i) => format(subDays(new Date(), i), 'yyyy-MM-dd')),
  })
  const habits: Habit[] = [
    habit('h1', 'Wake up early', '#f59e0b', 0.8),
    habit('h2', 'Review daily tasks', '#8b5cf6', 0.9),
    habit('h3', 'Log expenses', '#22c55e', 0.6),
    habit('h4', 'Read 10 pages', '#0ea5e9', 0.5),
  ]

  return { projects, tasks, apps, expenses, habits, reflections: [] }
}
