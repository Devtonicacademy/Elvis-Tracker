import { create } from 'zustand'

export type QuickKind = 'task' | 'expense' | 'project' | 'app' | 'habit'

interface UIState {
  paletteOpen: boolean
  quick: { kind: QuickKind; defaults?: Record<string, unknown>; editId?: string } | null
  taskId: string | null
  sidebarOpen: boolean
  helpOpen: boolean
  syncError: string | null
  setPalette(open: boolean): void
  openQuick(kind: QuickKind, defaults?: Record<string, unknown>, editId?: string): void
  closeQuick(): void
  openTask(id: string | null): void
  setSidebar(open: boolean): void
  setHelp(open: boolean): void
  setSyncError(message: string | null): void
}

export const useUI = create<UIState>()((set) => ({
  paletteOpen: false,
  quick: null,
  taskId: null,
  sidebarOpen: false,
  helpOpen: false,
  syncError: null,
  setPalette: (paletteOpen) => set({ paletteOpen }),
  openQuick: (kind, defaults, editId) => set({ quick: { kind, defaults, editId }, paletteOpen: false }),
  closeQuick: () => set({ quick: null }),
  openTask: (taskId) => set({ taskId }),
  setSidebar: (sidebarOpen) => set({ sidebarOpen }),
  setHelp: (helpOpen) => set({ helpOpen }),
  setSyncError: (syncError) => set({ syncError }),
}))

export function toggleTheme() {
  const dark = document.documentElement.classList.toggle('dark')
  try {
    localStorage.setItem('elvis-theme', dark ? 'dark' : 'light')
  } catch {
    /* storage unavailable */
  }
  return dark
}
