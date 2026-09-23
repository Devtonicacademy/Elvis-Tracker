import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUI } from '@/store/ui'

export const GO_KEYS: Record<string, { path: string; label: string }> = {
  d: { path: '/', label: 'Dashboard' },
  t: { path: '/today', label: 'Today' },
  l: { path: '/tasks', label: 'Tasks' },
  w: { path: '/week', label: 'Week' },
  c: { path: '/calendar', label: 'Calendar' },
  h: { path: '/habits', label: 'Habits' },
  b: { path: '/budget', label: 'Budget' },
  a: { path: '/apps', label: 'Apps' },
  i: { path: '/insights', label: 'Insights' },
  p: { path: '/projects', label: 'Projects' },
}

const isTyping = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))

/** Global keyboard shortcuts: ⌘K palette, N/E quick add, G+key navigation, ? help. */
export function useShortcuts() {
  const navigate = useNavigate()

  useEffect(() => {
    let gPressed = 0
    const onKey = (e: KeyboardEvent) => {
      const ui = useUI.getState()
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        ui.setPalette(!ui.paletteOpen)
        return
      }
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return
      if (ui.paletteOpen || ui.quick || ui.helpOpen) return

      const key = e.key.toLowerCase()
      if (Date.now() - gPressed < 800 && GO_KEYS[key]) {
        e.preventDefault()
        gPressed = 0
        navigate(GO_KEYS[key].path)
        return
      }
      if (key === 'g') gPressed = Date.now()
      else if (key === 'n') {
        e.preventDefault()
        ui.openQuick('task')
      } else if (key === 'e') {
        e.preventDefault()
        ui.openQuick('expense')
      } else if (key === '/') {
        e.preventDefault()
        ui.setPalette(true)
      } else if (e.key === '?') ui.setHelp(true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate])
}
