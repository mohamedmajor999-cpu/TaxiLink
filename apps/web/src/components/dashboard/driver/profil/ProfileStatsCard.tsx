'use client'

interface Props {
  monthLabel: string
  revenue: number
  courseCount: number
  deltaPercent: number | null
  previousMonthLabel?: string
}

export function ProfileStatsCard({
  monthLabel, revenue, courseCount, deltaPercent, previousMonthLabel,
}: Props) {
  const hasDelta = deltaPercent !== null
  const positive = hasDelta && deltaPercent! >= 0

  return (
    <section className="bg-ink text-paper rounded-2xl px-5 py-5 mb-6">
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-paper/60 mb-4">
        Ce mois-ci · {monthLabel}
      </p>
      <div className="grid grid-cols-3 divide-x divide-paper/10">
        <StatCell
          value={`${revenue.toLocaleString('fr-FR')}€`}
          label="Gains"
        />
        <StatCell
          value={String(courseCount)}
          label="Courses"
          className="px-3"
        />
        <StatCell
          value={hasDelta ? `${positive ? '+' : ''}${deltaPercent}%` : '—'}
          label={`vs ${previousMonthLabel ?? 'mois dernier'}`}
          accent={positive}
          className="pl-3"
        />
      </div>
    </section>
  )
}

function StatCell({
  value, label, accent = false, className = 'pr-3',
}: {
  value: string
  label: string
  accent?: boolean
  className?: string
}) {
  return (
    <div className={className}>
      <div className={`text-[22px] font-bold leading-none tabular-nums tracking-tight ${accent ? 'text-brand' : 'text-paper'}`}>
        {value}
      </div>
      <div className="text-[11px] text-paper/60 mt-1.5">{label}</div>
    </div>
  )
}
