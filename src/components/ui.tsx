import { Check, X } from 'lucide-react'
import {
  forwardRef,
  useEffect,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' | 'icon' }
>(function Button({ className, variant = 'secondary', size = 'md', ...props }, ref) {
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer',
        size === 'md' && 'h-9 px-3.5 text-sm',
        size === 'sm' && 'h-7 px-2.5 text-xs',
        size === 'icon' && 'h-9 w-9',
        variant === 'primary' && 'bg-brand text-white shadow-lg shadow-violet-500/20 hover:brightness-110',
        variant === 'secondary' && 'bg-surface-2 text-fg border border-line hover:border-accent/40',
        variant === 'ghost' && 'text-muted hover:text-fg hover:bg-surface-2',
        variant === 'danger' && 'bg-red-500/10 text-red-500 hover:bg-red-500/20',
        className,
      )}
      {...props}
    />
  )
})

const field =
  'w-full rounded-xl border border-line bg-surface-2/60 px-3 py-2 text-sm text-fg placeholder:text-muted/70 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...props },
  ref,
) {
  return <input ref={ref} className={cn(field, 'h-10', className)} {...props} />
})

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(field, 'min-h-20 resize-y', className)} {...props} />
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(field, 'h-10 cursor-pointer [&>option]:bg-surface', className)} {...props}>
      {children}
    </select>
  )
}

export function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn('flex flex-col gap-1.5', className)}>
      <span className="text-xs font-medium text-muted">{label}</span>
      {children}
    </label>
  )
}

export function Badge({ children, color, className }: { children: ReactNode; color?: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
        !color && 'bg-surface-2 text-muted border border-line',
        className,
      )}
      style={color ? { background: `${color}22`, color } : undefined}
    >
      {children}
    </span>
  )
}

export function Progress({ value, color, className }: { value: number; color?: string; className?: string }) {
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-surface-2', className)}>
      <div
        className={cn('h-full rounded-full transition-all duration-500', !color && 'bg-brand')}
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  )
}

export function Ring({
  value,
  size = 56,
  stroke = 6,
  color = 'var(--accent)',
  children,
}: {
  value: number
  size?: number
  stroke?: number
  color?: string
  children?: ReactNode
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--surface-2)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (pct / 100) * c}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-xs font-semibold">{children}</div>
    </div>
  )
}

export function Checkbox({
  checked,
  onChange,
  color,
  className,
  label,
}: {
  checked: boolean
  onChange: () => void
  color?: string
  className?: string
  label?: string
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label ?? (checked ? 'Mark incomplete' : 'Mark complete')}
      onClick={(e) => {
        e.stopPropagation()
        onChange()
      }}
      className={cn(
        'grid h-[18px] w-[18px] shrink-0 cursor-pointer place-items-center rounded-md border-2 transition',
        checked ? 'border-transparent text-white' : 'border-muted/50 hover:border-accent',
        className,
      )}
      style={checked ? { background: color ?? 'var(--accent)' } : undefined}
    >
      {checked && <Check className="h-3 w-3" strokeWidth={3.5} />}
    </button>
  )
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  wide,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  wide?: boolean
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-start sm:p-4 sm:pt-[12vh]">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'card animate-fade-in relative flex max-h-[88vh] w-full flex-col overflow-hidden rounded-b-none shadow-2xl sm:rounded-b-[1.25rem]',
          wide ? 'sm:max-w-2xl' : 'sm:max-w-lg',
        )}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-base font-semibold">{title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="scrollbar-thin overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-line px-5 py-3">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-[28px]">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function EmptyState({ icon, title, hint, action }: { icon: ReactNode; title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line px-6 py-12 text-center">
      <div className="mb-1 grid h-11 w-11 place-items-center rounded-2xl bg-surface-2 text-muted">{icon}</div>
      <p className="font-medium">{title}</p>
      {hint && <p className="max-w-xs text-sm text-muted">{hint}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: ReactNode }[]
}) {
  return (
    <div className="inline-flex rounded-xl border border-line bg-surface-2/60 p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[10px] px-3 text-xs font-medium transition',
            value === o.value ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-grid min-w-5 place-items-center rounded-md border border-line bg-surface-2 px-1 font-sans text-[10px] font-medium text-muted">
      {children}
    </kbd>
  )
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = 'var(--accent)',
}: {
  label: string
  value: ReactNode
  hint?: ReactNode
  icon: ReactNode
  tone?: string
}) {
  return (
    <div className="card relative overflow-hidden p-4">
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-20 blur-2xl"
        style={{ background: tone }}
      />
      <div className="flex items-center gap-2 text-xs font-medium text-muted">
        <span className="grid h-7 w-7 place-items-center rounded-lg" style={{ background: `color-mix(in srgb, ${tone} 15%, transparent)`, color: tone }}>
          {icon}
        </span>
        {label}
      </div>
      <div className="mt-3 text-2xl font-bold tracking-tight">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted">{hint}</div>}
    </div>
  )
}
