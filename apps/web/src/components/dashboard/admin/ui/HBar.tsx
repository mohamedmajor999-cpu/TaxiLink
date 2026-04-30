'use client'

interface Props {
  value:  number
  max:    number
  color?: string
}

// Barre horizontale colorée (in-table). Largeur 0-100% selon value/max.
export function HBar({ value, max, color = 'bg-primary' }: Props) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-bgsoft">
      <div className={`absolute inset-y-0 left-0 rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  )
}
