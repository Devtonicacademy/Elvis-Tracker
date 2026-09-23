import { GO_KEYS } from '@/lib/shortcuts'
import { useUI } from '@/store/ui'
import { Kbd, Modal } from './ui'

const rows: [string[], string][] = [
  [['⌘/Ctrl', 'K'], 'Command palette'],
  [['/'], 'Search'],
  [['N'], 'New task'],
  [['E'], 'Log expense'],
  [['?'], 'Show shortcuts'],
  [['Esc'], 'Close dialog / panel'],
]

export function HelpModal() {
  const { helpOpen, setHelp } = useUI()
  return (
    <Modal open={helpOpen} onClose={() => setHelp(false)} title="Keyboard shortcuts">
      <div className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
        {rows.map(([keys, label]) => (
          <div key={label} className="flex items-center justify-between py-1 text-sm">
            <span className="text-muted">{label}</span>
            <span className="flex gap-1">{keys.map((k) => <Kbd key={k}>{k}</Kbd>)}</span>
          </div>
        ))}
        {Object.entries(GO_KEYS).map(([k, g]) => (
          <div key={k} className="flex items-center justify-between py-1 text-sm">
            <span className="text-muted">Go to {g.label}</span>
            <span className="flex gap-1">
              <Kbd>G</Kbd>
              <Kbd>{k.toUpperCase()}</Kbd>
            </span>
          </div>
        ))}
      </div>
    </Modal>
  )
}
