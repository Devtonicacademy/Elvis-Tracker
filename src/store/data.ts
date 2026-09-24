import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { localRepository, type Repository, type Tables } from '@/data/repository'
import { buildSeed } from '@/data/seed'
import type { CollectionName, Collections, Settings, Task, TaskStatus } from '@/data/types'
import { todayISO, uid } from '@/lib/utils'

interface DataState extends Tables {
  settings: Settings
  create<K extends CollectionName>(collection: K, row: Omit<Collections[K], 'id' | 'createdAt'> & { id?: string }): Collections[K]
  patch<K extends CollectionName>(collection: K, id: string, changes: Partial<Collections[K]>): void
  remove(collection: CollectionName, id: string): void
  addTask(partial: Partial<Task> & Pick<Task, 'title'>): Task
  toggleTask(id: string): void
  moveTask(id: string, status: TaskStatus, beforeId?: string | null): void
  toggleHabit(id: string, date?: string): void
  setSettings(changes: Partial<Settings>): void
  replaceAll(tables: Tables): void
  /** Swap in data loaded from (or for) a signed-in account without writing it back. */
  hydrate(tables: Tables, settings?: Partial<Settings>): void
  resetDemo(): void
  clearAll(): void
}

let repo: Repository = localRepository
export const setRepository = (r: Repository) => {
  repo = r
}
export const getRepository = () => repo

/** Pushes a bulk replace to the backend: deletes rows that went away, upserts the rest. */
function mirror(prev: Tables, next: Tables) {
  if (repo.kind === 'local') return
  for (const c of Object.keys(next) as CollectionName[]) {
    const keep = new Set(next[c].map((r) => r.id))
    for (const row of prev[c]) if (!keep.has(row.id)) void repo.remove(c, row.id)
    for (const row of next[c]) void repo.upsert(c, row as never)
  }
}

export const defaultSettings: Settings = { currency: 'USD', monthlyBudget: 3000, name: 'Elvis' }

export const emptyTables: Tables = { tasks: [], projects: [], apps: [], expenses: [], habits: [], reflections: [] }

export const useData = create<DataState>()(
  persist(
    (set, get) => {
      const write = <K extends CollectionName>(collection: K, rows: Collections[K][], changed?: Collections[K]) => {
        set({ [collection]: rows } as Partial<DataState>)
        if (changed) void repo.upsert(collection, changed)
      }

      return {
        ...buildSeed(),
        settings: defaultSettings,

        create(collection, row) {
          const full = { createdAt: new Date().toISOString(), ...row, id: row.id ?? uid() } as never
          write(collection, [...(get()[collection] as never[]), full], full)
          return full
        },

        patch(collection, id, changes) {
          let changed: Collections[typeof collection] | undefined
          const rows = (get()[collection] as Collections[typeof collection][]).map((r) => {
            if (r.id !== id) return r
            changed = { ...r, ...changes }
            return changed
          })
          write(collection, rows, changed)
        },

        remove(collection, id) {
          set({ [collection]: (get()[collection] as { id: string }[]).filter((r) => r.id !== id) } as Partial<DataState>)
          void repo.remove(collection, id)
          if (collection === 'projects') {
            for (const c of ['tasks', 'apps', 'expenses'] as const)
              for (const row of get()[c]) if (row.projectId === id) get().patch(c, row.id, { projectId: null })
          }
        },

        addTask(partial) {
          const maxOrder = Math.max(0, ...get().tasks.map((t) => t.order))
          return get().create('tasks', {
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
            completedAt: null,
            order: maxOrder + 1,
            ...partial,
          }) as Task
        },

        toggleTask(id) {
          const task = get().tasks.find((t) => t.id === id)
          if (!task) return
          const done = task.status !== 'done'
          get().patch('tasks', id, {
            status: done ? 'done' : 'todo',
            completedAt: done ? new Date().toISOString() : null,
          })
        },

        moveTask(id, status, beforeId) {
          const tasks = get().tasks
          const task = tasks.find((t) => t.id === id)
          if (!task) return
          const column = tasks.filter((t) => t.status === status && t.id !== id).sort((a, b) => a.order - b.order)
          const idx = beforeId ? column.findIndex((t) => t.id === beforeId) : -1
          let order: number
          if (idx === -1) order = (column.at(-1)?.order ?? 0) + 1
          else order = idx === 0 ? column[0].order - 1 : (column[idx - 1].order + column[idx].order) / 2
          get().patch('tasks', id, {
            status,
            order,
            completedAt: status === 'done' ? (task.completedAt ?? new Date().toISOString()) : null,
          })
        },

        toggleHabit(id, date = todayISO()) {
          const habit = get().habits.find((h) => h.id === id)
          if (!habit) return
          const log = habit.log.includes(date) ? habit.log.filter((x) => x !== date) : [...habit.log, date]
          get().patch('habits', id, { log })
        },

        setSettings(changes) {
          const settings = { ...get().settings, ...changes }
          set({ settings })
          void repo.saveSettings(settings)
        },

        hydrate(tables, settings) {
          set({ ...tables, settings: { ...defaultSettings, ...settings } })
        },

        replaceAll(tables) {
          const prev = get()
          set(tables)
          mirror(prev, tables)
        },

        resetDemo() {
          get().replaceAll(buildSeed())
        },

        clearAll() {
          get().replaceAll(emptyTables)
        },
      }
    },
    {
      name: 'elvis-tracker',
      version: 1,
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
