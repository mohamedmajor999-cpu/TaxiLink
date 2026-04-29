'use client'

interface Props {
  viewCount: number
  hoursWaiting: number
}

export function PostedVisibilityStats({ viewCount, hoursWaiting }: Props) {
  return (
    <section className="bg-brand-soft border border-brand/30 rounded-2xl p-3 mb-4">
      <div className="grid grid-cols-2 text-center divide-x divide-ink/10">
        <Cell value={String(viewCount)} label="vues" />
        <Cell value={formatHoursLabel(hoursWaiting)} label="en ligne" />
      </div>
    </section>
  )
}

function Cell({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-[18px] font-extrabold text-ink leading-none tabular-nums">{value}</div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-warm-600 mt-1.5">{label}</div>
    </div>
  )
}

function formatHoursLabel(hoursWaiting: number): string {
  if (hoursWaiting < 1) return '< 1h'
  if (hoursWaiting < 24) return `${hoursWaiting}h`
  return `${Math.floor(hoursWaiting / 24)}j`
}
