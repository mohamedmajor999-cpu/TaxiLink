'use client'
import { ChevronRight } from 'lucide-react'
import { RideBadge } from '@/components/taxilink/RideBadge'
import { useHistoryTab, type MonthGroup } from './useHistoryTab'
import type { Mission } from '@/lib/supabase/types'
import { formatMissionPrice } from '@/lib/formatMissionPrice'

export function HistoryTab() {
  const h = useHistoryTab()

  if (h.loading) {
    return (
      <div className="mt-6 space-y-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-14 rounded-lg bg-warm-100 motion-safe:animate-pulse" />
        ))}
      </div>
    )
  }
  if (h.error) {
    return (
      <div className="mt-6 rounded-2xl border border-danger/30 bg-danger-soft p-5 text-sm text-danger">
        {h.error}
      </div>
    )
  }
  if (h.groups.length === 0) {
    return (
      <div className="mt-6 rounded-2xl border border-warm-200 bg-paper p-10 text-center">
        <p className="text-[20px] font-bold leading-tight text-ink mb-2 tracking-tight">
          Aucune course terminée
        </p>
        <p className="text-sm text-warm-600">
          Vos courses terminées s&apos;afficheront ici, regroupées par mois.
        </p>
      </div>
    )
  }

  return (
    <div className="mt-6">
      {h.groups.map((g) => <MonthSection key={g.key} group={g} />)}
    </div>
  )
}

function MonthSection({ group }: { group: MonthGroup }) {
  return (
    <section className="mb-8">
      <header className="flex items-end justify-between mb-3">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-warm-500">
          {group.label}
        </h3>
        <span className="text-[11px] text-warm-500">
          {group.missions.length} course{group.missions.length > 1 ? 's' : ''} · {group.total.toLocaleString('fr-FR')}€
        </span>
      </header>
      <ul className="rounded-2xl border border-warm-200 bg-paper overflow-hidden">
        {group.missions.map((m) => (
          <li key={m.id}>
            <HistoryRow mission={m} />
          </li>
        ))}
      </ul>
    </section>
  )
}

function HistoryRow({ mission }: { mission: Mission }) {
  const d = new Date(mission.completed_at ?? mission.scheduled_at)
  const dateLabel = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  const timeLabel = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  const badge = mission.type === 'CPAM'
    ? { variant: 'medical' as const, label: 'Médical' }
    : mission.type === 'PRIVE'
      ? { variant: 'private' as const, label: 'Privé' }
      : { variant: 'fleet' as const, label: 'TaxiLink' }

  return (
    <button
      type="button"
      className="w-full flex items-center gap-3 md:gap-4 px-4 py-3 border-b border-warm-100 last:border-b-0 hover:bg-warm-50 cursor-pointer text-left transition-colors"
    >
      <span className="text-[12px] text-warm-500 w-20 shrink-0 hidden md:block">
        {dateLabel} · {timeLabel}
      </span>
      <span className="text-[12px] text-warm-500 w-16 shrink-0 md:hidden">
        {dateLabel}
      </span>
      <RideBadge variant={badge.variant}>{badge.label}</RideBadge>
      <span className="flex-1 text-[13px] text-ink truncate">
        {mission.departure} → {mission.destination}
      </span>
      <span className="text-[16px] font-bold text-ink tabular-nums tracking-tight">
        {formatMissionPrice(mission)}
      </span>
      <ChevronRight className="w-4 h-4 text-warm-400 shrink-0" strokeWidth={1.6} />
    </button>
  )
}
