'use client'

interface Props {
  revenue: number
  courseCount: number
}

function formatRevenue(value: number): string {
  return `${Math.round(value).toLocaleString('fr-FR')} €`
}

export function ProfileStatsTiles({ revenue, courseCount }: Props) {
  return (
    <section className="grid grid-cols-2 gap-3 mb-6">
      <Tile label="Gains ce mois" value={formatRevenue(revenue)} />
      <Tile label="Courses ce mois" value={String(courseCount)} />
    </section>
  )
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-paper border border-warm-200 rounded-2xl px-3 py-3.5">
      <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-warm-500">
        {label}
      </div>
      <div className="mt-1.5 flex items-baseline gap-1">
        <span className="text-[18px] font-bold text-ink leading-none tabular-nums tracking-tight">
          {value}
        </span>
      </div>
    </div>
  )
}
