import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { differenceInCalendarDays, format, parseISO } from 'date-fns'

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))

export const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36)

export const todayISO = () => format(new Date(), 'yyyy-MM-dd')
export const toISODate = (d: Date) => format(d, 'yyyy-MM-dd')

export function formatMoney(amount: number, currency = 'USD', compact = false) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: compact || Number.isInteger(amount) ? 0 : 2,
      notation: compact && Math.abs(amount) >= 10000 ? 'compact' : 'standard',
    }).format(amount)
  } catch {
    return `${currency} ${amount.toFixed(2)}`
  }
}

export function formatMinutes(min: number) {
  if (min < 60) return `${min}M`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h}H${m}` : `${h}H`
}

/** "Today", "Tomorrow", "Overdue 3d", "In 5 days", or a short date. */
export function relativeDue(date: string) {
  const diff = differenceInCalendarDays(parseISO(date), new Date())
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  if (diff < 0) return `${-diff}d overdue`
  if (diff < 7) return `In ${diff} days`
  return format(parseISO(date), 'MMM d')
}

export const daysUntil = (date: string) => differenceInCalendarDays(parseISO(date), new Date())

/** Monthly-equivalent cost of a subscription. */
export function monthlyCost(cost: number, billing: string) {
  if (billing === 'monthly') return cost
  if (billing === 'yearly') return cost / 12
  return 0
}

/** Green under 85%, amber up to 100%, red when over budget. */
export const budgetTone = (pct: number) => (pct > 100 ? '#ef4444' : pct > 85 ? '#f59e0b' : '#22c55e')
