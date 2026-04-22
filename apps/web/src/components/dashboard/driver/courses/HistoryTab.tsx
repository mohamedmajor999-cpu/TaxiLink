'use client'
import { Download } from 'lucide-react'
import { RideBadge } from '@/components/taxilink/RideBadge'
import { useHistoryTab, type MonthGroup, type Period } from './useHistoryTab'
import type { Mission } from '@/lib/supabase/types'
import { formatMissionPrice } from '@/lib/formatMissionPrice'

// ─── Period pills ─────────────────────────────────────────────────────────────

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: 'week', label: '7 jours' },
  { value: 'month', label: '30 jours' },
  { value: 'all', label: 'Tout' },
]

// ─── Stats header ─────────────────────────────────────────────────────────────

function StatsHeader({
  stats,
  onExport,
}: {
  stats: { total: number; count: number; km: number }
  onExport: () => void
}) {
  return (
    <div className="relative rounded-2xl bg-ink px-5 py-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-6 flex-wrap">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-warm-500 mb-0.5">
            Revenus
          </p>
          <p className="text-[28px] font-bold leading-none text-paper tabular-nums">
            {stats.total.toLocaleString('fr-FR')}
            <span className="text-[18px] ml-0.5">€</span>
          </p>
        </div>
        <div className="h-10 w-px bg-warm-300 hidden sm:block" />
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-warm-500 mb-0.5">
            Courses
          </p>
          <p className="text-[22px] font-bold leading-none text-paper tabular-nums">
            {stats.count}
          </p>
        </div>
        <div className="h-10 w-px bg-warm-300 hidden sm:block" />
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-warm-500 mb-0.5">
            Km parcourus
          </p>
          <p className="text-[22px] font-bold leading-none text-paper tabular-nums">
            {stats.km.toLocaleString('fr-FR')}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onExport}
        title="Exporter en CSV"
        className="shrink-0 flex items-center gap-1.5 rounded-lg bg-warm-800 hover:bg-warm-600 px-3 py-2 text-[12px] font-semibold text-warm-300 transition-colors"
      >
        <Download className="w-3.5 h-3.5" strokeWidth={2} />
        CSV
      </button>
    </div>
  )
}

// ─── History row ──────────────────────────────────────────────────────────────

function HistoryRow({
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
      <span className="text-[15px] font-bold text-ink tabular-nums tracking-tight">
        {formatMissionPrice(mission)}
      </span>
    </button>
  )
}

// ─── Month section (used in 'all' view) ──────────────────────────────────────

function MonthSection({
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

// ─── Main component ───────────────────────────────────────────────────────────

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

  return (
    <div className="mt-6 space-y-4">
      {/* Stats header */}
      <StatsHeader stats={h.stats} onExport={h.handleExportCsv} />

      {/* Period pills */}
      <div className="flex gap-2">
        {PERIOD_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => h.setPeriod(value)}
            className={[
              'rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors',
              h.period === value
                ? 'bg-ink text-paper'
                : 'bg-warm-100 text-ink hover:bg-warm-200',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {h.filtered.length === 0 && (
        <div className="rounded-2xl border border-warm-200 bg-paper p-10 text-center">
          <p className="text-[20px] font-bold leading-tight text-ink mb-2 tracking-tight">
            Aucune course terminée
          </p>
          <p className="text-sm text-warm-600">
            {h.period === 'all'
              ? 'Vos courses terminées s’afficheront ici, regroupées par mois.'
              : 'Aucune course sur cette période.'}
          </p>
        </div>
      )}

      {/* All view : grouped by month */}
      {h.period === 'all' && h.groups.length > 0 && (
        <div>
          {h.groups.map((g) => (
            <MonthSection key={g.key} group={g} openDetail={h.openDetail} />
          ))}
        </div>
      )}

      {/* Week / month view : flat list */}
      {h.period !== 'all' && h.filtered.length > 0 && (
        <ul className="rounded-2xl border border-warm-200 bg-paper overflow-hidden">
          {h.filtered.map((m) => (
            <li key={m.id}>
              <HistoryRow mission={m} onClick={() => h.openDetail(m.id)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
