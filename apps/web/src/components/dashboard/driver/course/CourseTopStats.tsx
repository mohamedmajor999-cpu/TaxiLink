'use client'
import { useCourseTopStats } from './useCourseTopStats'

interface Props {
  scheduledAt: string
}

export function CourseTopStats({ scheduledAt }: Props) {
  const { date, time, countdown, isPast } = useCourseTopStats(scheduledAt)

  return (
    <div className="grid grid-cols-3 border-b border-warm-200">
      <Cell label="Date" value={date} />
      <Cell label="Départ dans" value={countdown} tone={isPast ? 'danger' : 'default'} border />
      <Cell label="Heure" value={time} mono border />
    </div>
  )
}

function Cell({
  label, value, sub, mono, border, tone = 'default',
}: {
  label: string; value: string; sub?: string; mono?: boolean; border?: boolean; tone?: 'default' | 'danger'
}) {
  const color = tone === 'danger' ? 'text-danger' : 'text-ink'
  return (
    <div className={`px-3 py-3 text-center ${border ? 'border-l border-warm-200' : ''}`}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-warm-500 mb-0.5">{label}</p>
      <p className={`text-[18px] md:text-[20px] font-bold ${color} ${mono ? 'tabular-nums' : ''} tracking-tight leading-none truncate`}>{value}</p>
      {sub && <p className="text-[10px] text-warm-500 mt-1">{sub}</p>}
    </div>
  )
}
