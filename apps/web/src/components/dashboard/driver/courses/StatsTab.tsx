'use client'
import { useMemo } from 'react'
import { Download } from 'lucide-react'
import { HistoryKpiTiles } from './HistoryKpiTiles'
import { HistoryHeatmap } from './HistoryHeatmap'
import { useStatsTab, type StatsPeriod } from './useStatsTab'
import { buildHeatmap } from '@/lib/historyHeatmap'

const PERIOD_OPTIONS: { value: StatsPeriod; label: string }[] = [
  { value: 'week', label: '7j' },
  { value: 'month', label: '30j' },
  { value: 'quarter', label: '90j' },
  { value: 'year', label: '12 mois' },
  { value: 'custom', label: 'Personnalisé' },
]

export function StatsTab() {
  const s = useStatsTab()
  const heatmapCellsYear = useMemo(() => buildHeatmap(s.missions, 365), [s.missions])
  const heatmapCellsHalf = useMemo(() => buildHeatmap(s.missions, 180), [s.missions])

  if (s.loading) {
    return (
      <div className="mt-2 space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 rounded-2xl bg-warm-100 motion-safe:animate-pulse" />
        ))}
      </div>
    )
  }
  if (s.error) {
    return (
      <div className="mt-2 rounded-2xl border border-danger/30 bg-danger-soft p-5 text-sm text-danger">
        {s.error}
      </div>
    )
  }

  const noData = s.filtered.length === 0

  return (
    <div className="mt-2 space-y-4 pb-24 md:pb-6">
      <HistoryKpiTiles
        total={s.kpi.total}
        count={s.kpi.count}
        avgPerRide={s.kpi.avgPerRide}
        cpamRatioPct={s.kpi.cpamRatioPct}
      />

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-4 lg:items-start">
        <div className="md:hidden">
          <HistoryHeatmap cells={heatmapCellsHalf} />
        </div>
        <div className="hidden md:block">
          <HistoryHeatmap cells={heatmapCellsYear} />
        </div>

        <section className="rounded-2xl border border-warm-200 bg-paper p-3.5 lg:p-4 lg:sticky lg:top-6">
          <h3 className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-warm-500 mb-2.5">
            Période
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {PERIOD_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => s.setPeriod(value)}
                className={`rounded-full px-3.5 py-1.5 text-[12px] font-bold transition-colors border ${
                  s.period === value
                    ? 'bg-ink text-paper border-ink'
                    : 'bg-paper text-ink border-warm-200 hover:bg-warm-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {s.period === 'custom' && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <label className="block">
                <span className="text-[10.5px] font-bold uppercase tracking-[0.06em] text-warm-500">Du</span>
                <input
                  type="date"
                  value={s.customFrom}
                  min={s.minDate}
                  max={s.customTo}
                  onChange={(e) => s.setCustomFrom(e.target.value)}
                  className="mt-1 w-full h-10 px-2.5 rounded-lg border border-warm-200 bg-paper text-[13px] text-ink focus:outline-none focus:border-ink"
                />
              </label>
              <label className="block">
                <span className="text-[10.5px] font-bold uppercase tracking-[0.06em] text-warm-500">Au</span>
                <input
                  type="date"
                  value={s.customTo}
                  min={s.customFrom}
                  max={s.maxDate}
                  onChange={(e) => s.setCustomTo(e.target.value)}
                  className="mt-1 w-full h-10 px-2.5 rounded-lg border border-warm-200 bg-paper text-[13px] text-ink focus:outline-none focus:border-ink"
                />
              </label>
              <p className="col-span-2 text-[10.5px] text-warm-500">
                Historique disponible jusqu&apos;à 1 an en arrière.
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={s.handleExport}
            disabled={noData}
            className="mt-3 w-full h-11 rounded-xl bg-ink text-paper text-[13px] font-extrabold inline-flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-warm-800 transition-colors"
          >
            <Download className="w-4 h-4" strokeWidth={2.4} />
            Télécharger en Excel ({s.filtered.length} course{s.filtered.length > 1 ? 's' : ''})
          </button>
        </section>
      </div>

      {noData && (
        <div className="rounded-2xl border border-warm-200 bg-paper p-8 text-center">
          <p className="text-[15px] font-bold leading-tight text-ink mb-1">Aucune course sur cette période</p>
          <p className="text-[12.5px] text-warm-500">
            Choisis une plage plus large ou continue à conduire — tes courses s&apos;afficheront ici.
          </p>
        </div>
      )}
    </div>
  )
}
