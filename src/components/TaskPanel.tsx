import { format, parseISO } from 'date-fns'
import { Plus, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Horizon, Priority, Task, TaskStatus } from '@/data/types'
import { uid } from '@/lib/utils'
import { useData } from '@/store/data'
import { useUI } from '@/store/ui'
import { PRIORITY_META, STATUS_META } from '@/data/meta'
import { Button, Checkbox, Field, Input, Progress, Select, Textarea } from './ui'

export function TaskPanel() {
  const { taskId, openTask } = useUI()
  const task = useData((s) => s.tasks.find((t) => t.id === taskId))

  useEffect(() => {
    if (!taskId) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && openTask(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [taskId, openTask])

  if (!task) return null
  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => openTask(null)} />
      <TaskEditor key={task.id} task={task} onClose={() => openTask(null)} />
    </div>,
    document.body,
  )
}

function TaskEditor({ task, onClose }: { task: Task; onClose: () => void }) {
  const { patch, remove, toggleTask, projects } = useData()
  const [title, setTitle] = useState(task.title)
  const [newSub, setNewSub] = useState('')
  const [tagInput, setTagInput] = useState('')
  const set = (changes: Partial<Task>) => patch('tasks', task.id, changes)
  const done = task.status === 'done'
  const subDone = task.subtasks.filter((s) => s.done).length

  const addSub = () => {
    if (!newSub.trim()) return
    set({ subtasks: [...task.subtasks, { id: uid(), title: newSub.trim(), done: false }] })
    setNewSub('')
  }

  const addTag = () => {
    const t = tagInput.trim().replace(/^#/, '').toLowerCase()
    if (t && !task.tags.includes(t)) set({ tags: [...task.tags, t] })
    setTagInput('')
  }

  return (
    <aside className="animate-slide-in relative flex h-full w-full max-w-lg flex-col border-l border-line bg-surface shadow-2xl">
      <div className="flex items-center gap-2 border-b border-line px-5 py-3">
        <Button variant={done ? 'secondary' : 'primary'} size="sm" onClick={() => toggleTask(task.id)}>
          {done ? 'Reopen' : 'Mark complete'}
        </Button>
        <span className="ml-2 text-xs text-muted">Created {format(parseISO(task.createdAt), 'MMM d')}</span>
        <div className="ml-auto flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Delete task"
            onClick={() => {
              remove('tasks', task.id)
              onClose()
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Close" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="scrollbar-thin flex-1 space-y-5 overflow-y-auto px-5 py-5">
        <textarea
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => title.trim() && title !== task.title && set({ title: title.trim() })}
          rows={2}
          className="w-full resize-none bg-transparent text-xl font-semibold leading-snug outline-none"
        />

        <div className="grid grid-cols-2 gap-3">
          <Field label="Status">
            <Select value={task.status} onChange={(e) => {
              const status = e.target.value as TaskStatus
              set({ status, completedAt: status === 'done' ? new Date().toISOString() : null })
            }}>
              {Object.entries(STATUS_META).map(([k, m]) => (
                <option key={k} value={k}>{m.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Priority">
            <Select value={task.priority} onChange={(e) => set({ priority: e.target.value as Priority })}>
              {Object.entries(PRIORITY_META).map(([k, m]) => (
                <option key={k} value={k}>{m.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Project">
            <Select value={task.projectId ?? ''} onChange={(e) => set({ projectId: e.target.value || null })}>
              <option value="">No project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Horizon">
            <Select value={task.horizon} onChange={(e) => set({ horizon: e.target.value as Horizon })}>
              <option value="next">Next</option>
              <option value="later">Later</option>
            </Select>
          </Field>
          <Field label="Due date">
            <Input type="date" value={task.dueDate ?? ''} onChange={(e) => set({ dueDate: e.target.value || null })} />
          </Field>
          <Field label="Time block">
            <Input type="time" value={task.startTime ?? ''} onChange={(e) => set({ startTime: e.target.value || null })} />
          </Field>
          <Field label="Estimate (minutes)" className="col-span-2">
            <div className="flex flex-wrap gap-1.5">
              {[15, 30, 45, 60, 90, 120, 240].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => set({ estimate: task.estimate === m ? null : m })}
                  className={`h-8 cursor-pointer rounded-lg border px-2.5 text-xs font-medium transition ${task.estimate === m ? 'border-accent bg-accent/15 text-accent' : 'border-line text-muted hover:text-fg'}`}
                >
                  {m < 60 ? `${m}m` : `${m / 60}h`}
                </button>
              ))}
            </div>
          </Field>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-muted">Subtasks</span>
            {task.subtasks.length > 0 && <span className="text-xs text-muted">{subDone}/{task.subtasks.length}</span>}
          </div>
          {task.subtasks.length > 0 && <Progress value={(subDone / task.subtasks.length) * 100} className="mb-3" />}
          <div className="space-y-1">
            {task.subtasks.map((s) => (
              <div key={s.id} className="group flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-surface-2">
                <Checkbox
                  checked={s.done}
                  onChange={() => set({ subtasks: task.subtasks.map((x) => (x.id === s.id ? { ...x, done: !x.done } : x)) })}
                />
                <span className={`flex-1 text-sm ${s.done ? 'text-muted line-through' : ''}`}>{s.title}</span>
                <button
                  className="cursor-pointer text-muted opacity-0 transition hover:text-red-500 group-hover:opacity-100"
                  aria-label="Remove subtask"
                  onClick={() => set({ subtasks: task.subtasks.filter((x) => x.id !== s.id) })}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <Input value={newSub} onChange={(e) => setNewSub(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addSub()} placeholder="Add a subtask…" className="h-9" />
            <Button size="icon" onClick={addSub} aria-label="Add subtask">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div>
          <span className="mb-2 block text-xs font-medium text-muted">Tags</span>
          <div className="flex flex-wrap items-center gap-1.5">
            {task.tags.map((t) => (
              <button
                key={t}
                onClick={() => set({ tags: task.tags.filter((x) => x !== t) })}
                className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-line bg-surface-2 px-2 py-1 text-xs hover:border-red-500/50"
              >
                #{t} <X className="h-3 w-3 text-muted" />
              </button>
            ))}
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ',') && (e.preventDefault(), addTag())}
              onBlur={addTag}
              placeholder="+ tag"
              className="h-7 w-24 rounded-md px-2 text-xs outline-none placeholder:text-muted"
            />
          </div>
        </div>

        <Field label="Notes">
          <Textarea
            defaultValue={task.notes}
            onBlur={(e) => e.target.value !== task.notes && set({ notes: e.target.value })}
            placeholder="Add details, links, context…"
            className="min-h-32"
          />
        </Field>
      </div>
    </aside>
  )
}
