import { Command } from 'cmdk'
import { ArrowRight, Boxes, CheckSquare, FolderKanban, Moon, Plus, Receipt, Repeat } from 'lucide-react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { GO_KEYS } from '@/lib/shortcuts'
import { useData } from '@/store/data'
import { toggleTheme, useUI, type QuickKind } from '@/store/ui'
import { PriorityIcon } from './task-bits'
import { Kbd } from './ui'

const itemCls =
  'flex h-10 cursor-pointer items-center gap-3 rounded-lg px-3 text-sm text-fg data-[selected=true]:bg-surface-2 [&>svg]:h-4 [&>svg]:w-4 [&>svg]:text-muted'
const groupCls =
  '[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-muted'

export function CommandPalette() {
  const { paletteOpen, setPalette, openQuick, openTask } = useUI()
  const tasks = useData((s) => s.tasks)
  const projects = useData((s) => s.projects)
  const apps = useData((s) => s.apps)
  const navigate = useNavigate()

  const run = (fn: () => void) => {
    setPalette(false)
    fn()
  }

  const creates: { kind: QuickKind; label: string; icon: ReactNode; key?: string }[] = [
    { kind: 'task', label: 'New task', icon: <CheckSquare />, key: 'N' },
    { kind: 'expense', label: 'Log expense', icon: <Receipt />, key: 'E' },
    { kind: 'project', label: 'New project', icon: <FolderKanban /> },
    { kind: 'app', label: 'Track an app / subscription', icon: <Boxes /> },
    { kind: 'habit', label: 'New habit', icon: <Repeat /> },
  ]

  return (
    <Command.Dialog
      open={paletteOpen}
      onOpenChange={setPalette}
      label="Command palette"
      overlayClassName="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
      contentClassName="card animate-fade-in fixed left-1/2 top-[12vh] z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 overflow-hidden shadow-2xl"
    >
      <Command.Input
        placeholder="Type a command or search tasks, projects, apps…"
        className="h-14 w-full border-b border-line bg-transparent px-5 text-[15px] outline-none placeholder:text-muted"
      />
      <Command.List className="scrollbar-thin max-h-[60vh] overflow-y-auto p-2">
        <Command.Empty className="py-10 text-center text-sm text-muted">No results.</Command.Empty>

        <Command.Group heading="Create" className={groupCls}>
          {creates.map((c) => (
            <Command.Item key={c.kind} className={itemCls} onSelect={() => openQuick(c.kind)}>
              <Plus />
              <span className="flex-1">{c.label}</span>
              {c.key && <Kbd>{c.key}</Kbd>}
            </Command.Item>
          ))}
        </Command.Group>

        <Command.Group heading="Go to" className={groupCls}>
          {Object.entries(GO_KEYS).map(([key, g]) => (
            <Command.Item key={g.path} value={`go ${g.label}`} className={itemCls} onSelect={() => run(() => navigate(g.path))}>
              <ArrowRight />
              <span className="flex-1">{g.label}</span>
              <span className="flex gap-1">
                <Kbd>G</Kbd>
                <Kbd>{key.toUpperCase()}</Kbd>
              </span>
            </Command.Item>
          ))}
          <Command.Item value="toggle theme dark light" className={itemCls} onSelect={() => run(() => toggleTheme())}>
            <Moon />
            Toggle dark / light mode
          </Command.Item>
        </Command.Group>

        <Command.Group heading="Tasks" className={groupCls}>
          {tasks
            .filter((t) => t.status !== 'done')
            .map((t) => (
              <Command.Item key={t.id} value={`task ${t.title} ${t.id}`} className={itemCls} onSelect={() => run(() => openTask(t.id))}>
                <PriorityIcon priority={t.priority} />
                <span className="truncate">{t.title}</span>
              </Command.Item>
            ))}
        </Command.Group>

        <Command.Group heading="Projects" className={groupCls}>
          {projects.map((p) => (
            <Command.Item key={p.id} value={`project ${p.name} ${p.id}`} className={itemCls} onSelect={() => run(() => navigate(`/projects/${p.id}`))}>
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color }} />
              {p.name}
            </Command.Item>
          ))}
        </Command.Group>

        <Command.Group heading="Apps" className={groupCls}>
          {apps.map((a) => (
            <Command.Item key={a.id} value={`app ${a.name} ${a.id}`} className={itemCls} onSelect={() => run(() => openQuick('app', undefined, a.id))}>
              <Boxes />
              {a.name}
            </Command.Item>
          ))}
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  )
}
