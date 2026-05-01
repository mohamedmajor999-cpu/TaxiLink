'use client'
import { Search, X } from 'lucide-react'
import { useMemo } from 'react'
import { useHistoryTab } from './useHistoryTab'
import type { Period, HistoryTypeFilter } from './historyHelpers'
import { HistoryKpiTiles } from './HistoryKpiTiles'
import { HistoryQuarterCard } from './HistoryQuarterCard'
import { HistoryHeatmap } from './HistoryHeatmap'
import { HistoryRow, MonthSection } from './HistoryRow'
import { useInvoiceGenerator } from './useInvoiceGenerator'
import { buildHeatmap } from '@/lib/historyHeatmap'

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: 'week', label: '7j' },
  { value: 'month', label: '30j' },
  { value: 'quarter', label: '90j' },
  { value: 'all', label: 'Tout' },
]

const TYPE_OPTIONS: { value: HistoryTypeFilter; label: string }[] = [
  { value: 'ALL', label: 'Tous' },
  { value: 'CPAM', label: 'CPAM' },
  { value: 'PRIVE', label: 'Privé' },
]

export function HistoryTab() {
  const h = useHistoryTab()
  const invoice = useInvoiceGenerator()

  // Heatmap calculee sur l'ensemble des missions terminees (pas les filtrees)
  // pour donner une vue 12 mois cohérente independante des filtres en cours.
  const heatmapCells = useMemo(() => buildHeatmap(h.missions, 365), [h.missions])

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
    <div className="mt-2 space-y-4">
      <HistoryKpiTiles
        total={h.kpi.total}
        count={h.kpi.count}
        avgPerRide={h.kpi.avgPerRide}
        cpamRatioPct={h.kpi.cpamRatioPct}
      />

      {h.missions.length > 0 && <HistoryHeatmap cells={heatmapCells} />}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-500 pointer-events-none" strokeWidth={2} />
        <input
          type="search"
          value={h.query}
          onChange={(e) => h.setQuery(e.target.value)}
          placeholder="Rechercher patient, adresse, motif…"
          aria-label="Rechercher dans l'historique"
          className="w-full h-11 pl-10 pr-10 rounded-2xl border border-warm-200 bg-paper text-[13.5px] text-ink placeholder:text-warm-500 focus:outline-none focus:border-ink"
        />
        {h.query && (
          <button
            type="button"
            onClick={() => h.setQuery('')}
            aria-label="Effacer la recherche"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full hover:bg-warm-100 inline-flex items-center justify-center"
          >
            <X className="w-3.5 h-3.5 text-warm-500" strokeWidth={2.4} />
          </button>
        )}
      </div>

      <div className="flex gap-1.5 overflow-x-auto hide-scrollbar">
        {PERIOD_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => h.setPeriod(value)}
            className={[
              'shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-bold transition-colors border',
              h.period === value
                ? 'bg-ink text-paper border-ink'
                : 'bg-paper text-ink border-warm-200 hover:bg-warm-50',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex gap-1.5 overflow-x-auto hide-scrollbar">
        {TYPE_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => h.setTypeFilter(value)}
            className={[
              'shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-bold transition-colors border',
              h.typeFilter === value
                ? 'bg-ink text-paper border-ink'
                : 'bg-paper text-ink border-warm-200 hover:bg-warm-50',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          onClick={h.handleExportCsv}
          className="shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-bold text-warm-600 border border-warm-200 hover:bg-warm-50 ml-auto"
        >
          Export CSV
        </button>
      </div>

      <HistoryQuarterCard
        missions={h.filtered}
        generating={invoice.generating}
        onGenerateInvoice={(year, quarter) => invoice.generate(h.filtered, year, quarter)}
      />

      {h.filtered.length === 0 && (
        <div className="rounded-2xl border border-warm-200 bg-paper p-10 text-center">
          <p className="text-[20px] font-bold leading-tight text-ink mb-2 tracking-tight">
            {h.query ? 'Aucun résultat' : 'Aucune course terminée'}
          </p>
          <p className="text-sm text-warm-600">
            {h.query
              ? `Aucune course ne correspond à « ${h.query} ».`
              : h.period === 'all'
                ? 'Vos courses terminées s’afficheront ici, regroupées par mois.'
                : 'Aucune course sur cette période.'}
          </p>
        </div>
      )}

      {h.period === 'all' && h.groups.length > 0 && (
        <div>
          {h.groups.map((g) => (
            <MonthSection key={g.key} group={g} openDetail={h.openDetail} />
          ))}
        </div>
      )}

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
