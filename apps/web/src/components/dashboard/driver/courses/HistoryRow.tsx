'use client'
import { RideBadge } from '@/components/taxilink/RideBadge'
import { computeDisplayFare } from '@/lib/missionFare'
import type { Mission } from '@/lib/supabase/types'
import type { MonthGroup } from './historyHelpers'

export function HistoryRow({
  mission,
  onClick,
}: {
  mission: Mission
  onClick: () => void
}) {
  const d = new Date(mission.completed_at ?? mission.scheduled_at)
  const dateLabel = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  const badge =
    mission.type === 'CPAM'
      ? { variant: 'medical' as const, label: 'Médical' }
      : mission.type === 'PRIVE'
        ? { variant: 'private' as const, label: 'Privé' }
        : { variant: 'fleet' as const, label: 'TaxiLink' }
  const fare = computeDisplayFare(mission)
  const priceLabel = fare.value > 0 ? `${fare.isEstimated ? '~' : ''}${fare.value.toFixed(0)}€` : '—'

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 border-b border-warm-100 last:border-b-0 hover:bg-warm-50 cursor-pointer text-left transition-colors"
    >
      <span className="text-[12px] text-warm-500 w-16 shrink-0">{dateLabel}</span>
      <RideBadge variant={badge.variant}>{badge.label}</RideBadge>
      <span className="flex-1 text-[13px] text-ink truncate">
        {mission.departure} → {mission.destination}
      </span>
      {mission.auto_completed && (
        <span
          className="text-[9px] font-bold uppercase tracking-wide text-warm-500 px-1.5 py-0.5 rounded bg-warm-100"
          title="Course clôturée automatiquement"
        >
          auto
        </span>
      )}
      <span
        className="text-[15px] font-bold text-ink tabular-nums tracking-tight"
        title={fare.isEstimated ? 'Tarif estimé' : undefined}
      >
        {priceLabel}
      </span>
    </button>
  )
}

export function MonthSection({
  group,
  openDetail,
}: {
  group: MonthGroup
  openDetail: (id: string) => void
}) {
  return (
    <section className="mb-6">
      <header className="flex items-end justify-between mb-2">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-warm-500">
          {group.label}
        </h3>
        <span className="text-[11px] text-warm-500">
          {group.missions.length} course{group.missions.length > 1 ? 's' : ''} ·{' '}
          {group.total.toLocaleString('fr-FR')}€
        </span>
      </header>
      <ul className="rounded-2xl border border-warm-200 bg-paper overflow-hidden">
        {group.missions.map((m) => (
          <li key={m.id}>
            <HistoryRow mission={m} onClick={() => openDetail(m.id)} />
          </li>
        ))}
      </ul>
    </section>
  )
}
