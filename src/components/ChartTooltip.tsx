export function ChartTooltip({
  active,
  payload,
  label,
  format = (v: number) => String(v),
}: {
  active?: boolean
  payload?: { name?: string; value?: number; color?: string; payload?: { fill?: string } }[]
  label?: string | number
  format?: (v: number) => string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2 text-xs shadow-xl">
      {label !== undefined && <div className="mb-1 font-semibold text-fg">{label}</div>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-muted">
          <span className="h-2 w-2 rounded-full" style={{ background: p.payload?.fill ?? p.color }} />
          <span>{p.name}</span>
          <span className="ml-auto pl-3 font-semibold text-fg">{format(Number(p.value ?? 0))}</span>
        </div>
      ))}
    </div>
  )
}
