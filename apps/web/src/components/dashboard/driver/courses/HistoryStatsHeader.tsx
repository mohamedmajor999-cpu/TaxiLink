'use client'
import { Download } from 'lucide-react'

interface HistoryStatsHeaderProps {
  stats: { total: number; count: number; km: number }
  onExport: () => void
}

export function HistoryStatsHeader({ stats, onExport }: HistoryStatsHeaderProps) {
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
