import { format } from 'date-fns'
import { Menu, Plus, Search } from 'lucide-react'
import { Outlet } from 'react-router-dom'
import { CommandPalette } from '@/components/CommandPalette'
import { HelpModal } from '@/components/HelpModal'
import { QuickAdd } from '@/components/QuickAdd'
import { TaskPanel } from '@/components/TaskPanel'
import { Button, Kbd } from '@/components/ui'
import { cn } from '@/lib/utils'
import { useShortcuts } from '@/lib/shortcuts'
import { useUI } from '@/store/ui'
import { Sidebar } from './Sidebar'

export function Layout() {
  useShortcuts()
  const { sidebarOpen, setSidebar, setPalette, openQuick } = useUI()
  const mac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

  return (
    <div className="flex h-full">
      {/* Mobile overlay */}
      <div
        className={cn('fixed inset-0 z-30 bg-black/50 backdrop-blur-sm transition lg:hidden', sidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0')}
        onClick={() => setSidebar(false)}
      />
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-[264px] shrink-0 border-r border-line bg-surface transition-transform lg:static lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <Sidebar />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b border-line bg-bg/80 px-4 backdrop-blur-xl sm:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebar(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </Button>
          <button
            onClick={() => setPalette(true)}
            className="flex h-10 w-full max-w-md cursor-pointer items-center gap-2.5 rounded-xl border border-line bg-surface px-3 text-sm text-muted transition hover:border-accent/40"
          >
            <Search className="h-4 w-4" />
            <span className="flex-1 truncate text-left">Search or jump to…</span>
            <span className="hidden items-center gap-1 sm:flex">
              <Kbd>{mac ? '⌘' : 'Ctrl'}</Kbd>
              <Kbd>K</Kbd>
            </span>
          </button>
          <div className="ml-auto hidden text-right text-xs leading-tight text-muted md:block">
            <div className="font-semibold text-fg">{format(new Date(), 'EEEE')}</div>
            {format(new Date(), 'MMMM d, yyyy')}
          </div>
          <Button variant="primary" onClick={() => openQuick('task')} className="hidden sm:inline-flex">
            <Plus className="h-4 w-4" /> New task
          </Button>
        </header>

        <main className="scrollbar-thin flex-1 overflow-y-auto">
          <div className="animate-fade-in mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <Outlet />
          </div>
        </main>
      </div>

      <button
        onClick={() => openQuick('task')}
        aria-label="Quick add task"
        className="bg-brand fixed bottom-6 right-6 z-30 grid h-14 w-14 cursor-pointer place-items-center rounded-full text-white shadow-2xl shadow-violet-600/40 transition hover:scale-105 active:scale-95"
      >
        <Plus className="h-6 w-6" />
      </button>

      <CommandPalette />
      <QuickAdd />
      <TaskPanel />
      <HelpModal />
    </div>
  )
}
