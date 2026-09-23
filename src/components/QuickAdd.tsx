import { Sparkles } from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
import {
  EXPENSE_CATEGORIES,
  PROJECT_COLORS,
  type AppStatus,
  type Billing,
  type Horizon,
  type Priority,
  type ProjectStatus,
  type TaskStatus,
} from '@/data/types'
import { parseQuickTask } from '@/lib/parse'
import { cn, formatMinutes, todayISO } from '@/lib/utils'
import { useData } from '@/store/data'
import { useUI } from '@/store/ui'
import { PRIORITY_META, STATUS_META } from '@/data/meta'
import { PriorityIcon } from './task-bits'
import { Badge, Button, Field, Input, Modal, Select, Textarea } from './ui'

const str = (v: unknown, fallback = '') => (typeof v === 'string' ? v : fallback)

function ProjectSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const projects = useData((s) => s.projects)
  return (
    <Select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">No project</option>
      {projects.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}
        </option>
      ))}
    </Select>
  )
}

export function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {PROJECT_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          aria-label={`Color ${c}`}
          onClick={() => onChange(c)}
          className={cn('h-7 w-7 cursor-pointer rounded-full transition', value === c && 'ring-2 ring-fg ring-offset-2 ring-offset-surface')}
          style={{ background: c }}
        />
      ))}
    </div>
  )
}

function FormShell({ onSubmit, onCancel, submitLabel, children, extra }: { onSubmit: () => void; onCancel: () => void; submitLabel: string; children: ReactNode; extra?: ReactNode }) {
  const submit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit()
  }
  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      {children}
      <div className="-mx-5 -mb-4 mt-2 flex items-center gap-2 border-t border-line px-5 py-3">
        {extra}
        <div className="ml-auto flex gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            {submitLabel}
          </Button>
        </div>
      </div>
    </form>
  )
}

function TaskForm({ defaults, onDone }: { defaults: Record<string, unknown>; onDone: () => void }) {
  const projects = useData((s) => s.projects)
  const addTask = useData((s) => s.addTask)
  const [raw, setRaw] = useState('')
  const [projectId, setProjectId] = useState(str(defaults.projectId))
  const [priority, setPriority] = useState<Priority>((defaults.priority as Priority) ?? 'medium')
  const [status, setStatus] = useState<TaskStatus>((defaults.status as TaskStatus) ?? 'todo')
  const [horizon, setHorizon] = useState<Horizon>((defaults.horizon as Horizon) ?? 'next')
  const [dueDate, setDueDate] = useState(str(defaults.dueDate))
  const [startTime, setStartTime] = useState(str(defaults.startTime))
  const [notes, setNotes] = useState('')

  const parsed = parseQuickTask(raw, projects)

  const save = () => {
    if (!parsed.title.trim()) return
    addTask({
      title: parsed.title.trim(),
      projectId: parsed.projectId ?? (projectId || null),
      priority: parsed.priority ?? priority,
      status,
      horizon,
      dueDate: parsed.dueDate ?? (dueDate || null),
      startTime: startTime || null,
      estimate: parsed.estimate ?? null,
      tags: parsed.tags,
      notes,
    })
    onDone()
  }

  const chips = [
    parsed.priority && <Badge key="p" color={PRIORITY_META[parsed.priority].color}>{parsed.priority}</Badge>,
    parsed.dueDate && <Badge key="d" color="#f59e0b">{parsed.dueDate}</Badge>,
    parsed.estimate && <Badge key="e" color="#3b82f6">{formatMinutes(parsed.estimate)}</Badge>,
    parsed.projectId && <Badge key="pr" color={projects.find((p) => p.id === parsed.projectId)?.color}>{projects.find((p) => p.id === parsed.projectId)?.name}</Badge>,
    ...parsed.tags.map((t) => <Badge key={t}>#{t}</Badge>),
  ].filter(Boolean)

  return (
    <FormShell onSubmit={save} onCancel={onDone} submitLabel="Add task">
      <div>
        <Input
          autoFocus
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder="e.g. Send invoice tomorrow !high #finance 30m @website"
          className="h-12 text-base"
        />
        <div className="mt-2 flex min-h-5 flex-wrap items-center gap-1.5 text-xs text-muted">
          <Sparkles className="h-3.5 w-3.5 text-accent" />
          {chips.length ? chips : <span>Smart input: !priority · #tag · today/tomorrow/fri · 30m/2h · @project</span>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Project">
          <ProjectSelect value={projectId} onChange={setProjectId} />
        </Field>
        <Field label="Priority">
          <Select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
            {Object.entries(PRIORITY_META).map(([k, m]) => (
              <option key={k} value={k}>
                {m.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Status">
          <Select value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)}>
            {Object.entries(STATUS_META).map(([k, m]) => (
              <option key={k} value={k}>
                {m.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Horizon">
          <Select value={horizon} onChange={(e) => setHorizon(e.target.value as Horizon)}>
            <option value="next">Next</option>
            <option value="later">Later</option>
          </Select>
        </Field>
        <Field label="Due date">
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </Field>
        <Field label="Time block (optional)">
          <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </Field>
      </div>
      <Field label="Notes">
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Details, links, context…" />
      </Field>
      <div className="flex items-center gap-2 text-xs text-muted">
        <PriorityIcon priority={parsed.priority ?? priority} /> Press Enter to save
      </div>
    </FormShell>
  )
}

function ExpenseForm({ defaults, editId, onDone }: { defaults: Record<string, unknown>; editId?: string; onDone: () => void }) {
  const { expenses, create, patch, remove, settings } = useData()
  const existing = expenses.find((e) => e.id === editId)
  const [title, setTitle] = useState(existing?.title ?? '')
  const [amount, setAmount] = useState(existing ? String(existing.amount) : '')
  const [category, setCategory] = useState(existing?.category ?? 'Software')
  const [projectId, setProjectId] = useState(existing?.projectId ?? str(defaults.projectId))
  const [date, setDate] = useState(existing?.date ?? todayISO())
  const [notes, setNotes] = useState(existing?.notes ?? '')

  const save = () => {
    const value = parseFloat(amount)
    if (!title.trim() || !Number.isFinite(value)) return
    const row = { title: title.trim(), amount: value, category, projectId: projectId || null, date, notes }
    if (existing) patch('expenses', existing.id, row)
    else create('expenses', row)
    onDone()
  }

  return (
    <FormShell
      onSubmit={save}
      onCancel={onDone}
      submitLabel={existing ? 'Save' : 'Log expense'}
      extra={existing && <Button type="button" variant="danger" onClick={() => { remove('expenses', existing.id); onDone() }}>Delete</Button>}
    >
      <div className="grid grid-cols-[1fr_140px] gap-3">
        <Field label="What for?">
          <Input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Figma subscription" />
        </Field>
        <Field label={`Amount (${settings.currency})`}>
          <Input type="number" inputMode="decimal" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Category">
          <Select value={category} onChange={(e) => setCategory(e.target.value)}>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
        </Field>
        <Field label="Date">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Project" className="col-span-2">
          <ProjectSelect value={projectId} onChange={setProjectId} />
        </Field>
      </div>
      <Field label="Notes">
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="min-h-14" />
      </Field>
    </FormShell>
  )
}

function ProjectForm({ editId, onDone }: { editId?: string; onDone: () => void }) {
  const { projects, create, patch, remove } = useData()
  const existing = projects.find((p) => p.id === editId)
  const [name, setName] = useState(existing?.name ?? '')
  const [description, setDescription] = useState(existing?.description ?? '')
  const [color, setColor] = useState(existing?.color ?? PROJECT_COLORS[projects.length % PROJECT_COLORS.length])
  const [budget, setBudget] = useState(existing ? String(existing.budget) : '')
  const [deadline, setDeadline] = useState(existing?.deadline ?? '')
  const [status, setStatus] = useState<ProjectStatus>(existing?.status ?? 'active')

  const save = () => {
    if (!name.trim()) return
    const row = { name: name.trim(), description, color, budget: parseFloat(budget) || 0, deadline: deadline || null, status }
    if (existing) patch('projects', existing.id, row)
    else create('projects', row)
    onDone()
  }

  return (
    <FormShell
      onSubmit={save}
      onCancel={onDone}
      submitLabel={existing ? 'Save' : 'Create project'}
      extra={
        existing && (
          <Button
            type="button"
            variant="danger"
            onClick={() => {
              if (confirm(`Delete "${existing.name}"? Its tasks will be kept without a project.`)) {
                remove('projects', existing.id)
                onDone()
              }
            }}
          >
            Delete
          </Button>
        )
      }
    >
      <Field label="Name">
        <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Launch new website" />
      </Field>
      <Field label="Description">
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-14" />
      </Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Budget">
          <Input type="number" min="0" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="0" />
        </Field>
        <Field label="Deadline (goal)">
          <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </Field>
        <Field label="Status">
          <Select value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus)}>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="done">Done</option>
          </Select>
        </Field>
      </div>
      <Field label="Color">
        <ColorPicker value={color} onChange={setColor} />
      </Field>
    </FormShell>
  )
}

function AppForm({ editId, onDone }: { editId?: string; onDone: () => void }) {
  const { apps, create, patch, remove } = useData()
  const existing = apps.find((a) => a.id === editId)
  const [name, setName] = useState(existing?.name ?? '')
  const [url, setUrl] = useState(existing?.url ?? '')
  const [category, setCategory] = useState(existing?.category ?? '')
  const [status, setStatus] = useState<AppStatus>(existing?.status ?? 'live')
  const [billing, setBilling] = useState<Billing>(existing?.billing ?? 'monthly')
  const [cost, setCost] = useState(existing ? String(existing.cost) : '')
  const [renewalDate, setRenewalDate] = useState(existing?.renewalDate ?? '')
  const [projectId, setProjectId] = useState(existing?.projectId ?? '')
  const [notes, setNotes] = useState(existing?.notes ?? '')

  const save = () => {
    if (!name.trim()) return
    const row = {
      name: name.trim(),
      url,
      category: category || 'General',
      status,
      billing,
      cost: billing === 'free' ? 0 : parseFloat(cost) || 0,
      renewalDate: renewalDate || null,
      projectId: projectId || null,
      notes,
    }
    if (existing) patch('apps', existing.id, row)
    else create('apps', row)
    onDone()
  }

  return (
    <FormShell
      onSubmit={save}
      onCancel={onDone}
      submitLabel={existing ? 'Save' : 'Add app'}
      extra={existing && <Button type="button" variant="danger" onClick={() => { remove('apps', existing.id); onDone() }}>Delete</Button>}
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="Name">
          <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Figma, or your own app" />
        </Field>
        <Field label="Category">
          <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Design, Hosting, My product…" list="app-cats" />
          <datalist id="app-cats">
            {[...new Set(apps.map((a) => a.category))].map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>
        <Field label="Status">
          <Select value={status} onChange={(e) => setStatus(e.target.value as AppStatus)}>
            <option value="idea">💡 Idea</option>
            <option value="building">🛠 Building</option>
            <option value="live">🟢 Live / in use</option>
            <option value="paused">⏸ Paused</option>
          </Select>
        </Field>
        <Field label="Link">
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" />
        </Field>
        <Field label="Billing">
          <Select value={billing} onChange={(e) => setBilling(e.target.value as Billing)}>
            <option value="free">Free</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
            <option value="one_time">One-time</option>
          </Select>
        </Field>
        <Field label="Cost">
          <Input type="number" min="0" step="0.01" value={cost} disabled={billing === 'free'} onChange={(e) => setCost(e.target.value)} placeholder="0" />
        </Field>
        <Field label="Next renewal">
          <Input type="date" value={renewalDate} onChange={(e) => setRenewalDate(e.target.value)} />
        </Field>
        <Field label="Project">
          <ProjectSelect value={projectId} onChange={setProjectId} />
        </Field>
      </div>
      <Field label="Notes">
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="min-h-14" />
      </Field>
    </FormShell>
  )
}

function HabitForm({ editId, onDone }: { editId?: string; onDone: () => void }) {
  const { habits, create, patch, remove } = useData()
  const existing = habits.find((h) => h.id === editId)
  const [name, setName] = useState(existing?.name ?? '')
  const [color, setColor] = useState(existing?.color ?? PROJECT_COLORS[habits.length % PROJECT_COLORS.length])
  const save = () => {
    if (!name.trim()) return
    if (existing) patch('habits', existing.id, { name: name.trim(), color })
    else create('habits', { name: name.trim(), color, log: [] })
    onDone()
  }
  return (
    <FormShell
      onSubmit={save}
      onCancel={onDone}
      submitLabel={existing ? 'Save' : 'Add habit'}
      extra={existing && <Button type="button" variant="danger" onClick={() => { remove('habits', existing.id); onDone() }}>Delete</Button>}
    >
      <Field label="Habit">
        <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Do 10 pushups" />
      </Field>
      <Field label="Color">
        <ColorPicker value={color} onChange={setColor} />
      </Field>
    </FormShell>
  )
}

const TITLES = { task: 'New task', expense: 'Log expense', project: 'Project', app: 'App / subscription', habit: 'Habit' }

export function QuickAdd() {
  const { quick, closeQuick } = useUI()
  if (!quick) return null
  const { kind, defaults = {}, editId } = quick
  const title = editId ? `Edit ${TITLES[kind].toLowerCase()}` : kind === 'task' || kind === 'expense' ? TITLES[kind] : `New ${TITLES[kind].toLowerCase()}`
  return (
    <Modal open onClose={closeQuick} title={title} wide={kind === 'app'}>
      {kind === 'task' && <TaskForm defaults={defaults} onDone={closeQuick} />}
      {kind === 'expense' && <ExpenseForm defaults={defaults} editId={editId} onDone={closeQuick} />}
      {kind === 'project' && <ProjectForm editId={editId} onDone={closeQuick} />}
      {kind === 'app' && <AppForm editId={editId} onDone={closeQuick} />}
      {kind === 'habit' && <HabitForm editId={editId} onDone={closeQuick} />}
    </Modal>
  )
}
