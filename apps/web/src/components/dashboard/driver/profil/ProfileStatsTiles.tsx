'use client'
import { Star } from 'lucide-react'

interface Props {
  revenue: number
  courseCount: number
  rating: number | null
}

function formatRevenue(value: number): string {
  return `${Math.round(value).toLocaleString('fr-FR')} €`
}

function formatRating(value: number | null): string {
  if (value === null || value === 0) return '—'
  return value.toFixed(1).replace('.', ',')
}

export function ProfileStatsTiles({ revenue, courseCount, rating }: Props) {
  return (
    <section className="grid grid-cols-3 gap-3 mb-6">
      <Tile label="Ce mois" value={formatRevenue(revenue)} />
      <Tile label="Courses" value={String(courseCount)} />
      <Tile
        label="Note"
        value={formatRating(rating)}
        suffix={
          <Star className="w-3.5 h-3.5 text-ink fill-ink" strokeWidth={1.5} />
        }
      />
    </section>
  )
}

function Tile({
  label, value, suffix,
}: { label: string; value: string; suffix?: React.ReactNode }) {
  return (
    <div className="bg-paper border border-warm-200 rounded-2xl px-3 py-3.5">
      <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-warm-500">
        {label}
      </div>
      <div className="mt-1.5 flex items-baseline gap-1">
        <span className="text-[18px] font-bold text-ink leading-none tabular-nums tracking-tight">
          {value}
        </span>
        {suffix}
      </div>
    </div>
  )
}
