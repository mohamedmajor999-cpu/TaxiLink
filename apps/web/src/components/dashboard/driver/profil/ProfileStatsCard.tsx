'use client'
import { Download } from 'lucide-react'

interface Props {
  monthLabel: string
  revenue: number
  deltaPercent: number | null
  weeks: { label: string; value: number }[]
  courseCount: number
  kmTotal: number
  sharedCount?: number
  networkGains?: number
}

export function ProfileStatsCard({
  monthLabel, revenue, deltaPercent, weeks,
  courseCount, kmTotal, sharedCount = 0, networkGains = 0,
}: Props) {
  const max = Math.max(...weeks.map((w) => w.value), 1)

  return (
    <section className="bg-ink text-paper rounded-2xl p-6 mb-6 shadow-card">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-paper/60 mb-1">
            Gains du mois · {monthLabel}
          </p>
          <div className="flex items-baseline gap-1">
            <span className="font-serif text-[48px] leading-none text-paper">
              {revenue.toLocaleString('fr-FR')}
            </span>
            <span className="font-serif text-[24px] text-paper/80">€</span>
          </div>
          {deltaPercent !== null && (
            <p className={`text-[12px] mt-2 ${deltaPercent >= 0 ? 'text-brand' : 'text-paper/60'}`}>
              {deltaPercent >= 0 ? '↑' : '↓'} {Math.abs(deltaPercent)}% vs mois dernier
            </p>
          )}
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1 h-8 px-3 rounded-lg bg-brand text-ink text-xs font-semibold hover:bg-brand/90 transition-colors"
        >
          <Download className="w-3 h-3" strokeWidth={2} />
          Exporter PDF
        </button>
      </div>

      <div className="relative h-[80px] my-5">
        <div className="flex items-end justify-between gap-2 h-full">
          {weeks.map((w, i) => {
            const isLast = i === weeks.length - 1
            const heightPct = (w.value / max) * 100
            return (
              <div key={w.label} className="flex-1 flex flex-col items-stretch h-full">
                <div className="flex-1 flex items-end">
                  <div
                    className={`w-full rounded-t-md ${isLast ? 'bg-brand' : 'bg-paper/15'}`}
                    style={{ height: `${heightPct}%` }}
                    aria-label={`${w.label}: ${w.value}€`}
                  />
                </div>
              </div>
            )
          })}
        </div>
        <div className="absolute left-0 right-0 -bottom-5 flex justify-between gap-2 text-[10px]">
          {weeks.map((w, i) => {
            const isLast = i === weeks.length - 1
            return (
              <span
                key={`l-${w.label}`}
                className={`flex-1 text-center ${isLast ? 'text-brand' : 'text-paper/50'}`}
              >
                {isLast ? `${w.label} · cette semaine` : w.label}
              </span>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 pt-8 border-t border-paper/15">
        <StatItem value={String(courseCount)} label="courses" />
        <StatItem value={kmTotal.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} label="km" />
        <StatItem value={String(sharedCount)} label="partagées" />
        <StatItem value={`+${networkGains}€`} label="gains réseau" accent />
      </div>
    </section>
  )
}

function StatItem({ value, label, accent = false }: { value: string; label: string; accent?: boolean }) {
  return (
    <div>
      <div className={`font-serif text-[20px] leading-none ${accent ? 'text-brand' : 'text-paper'}`}>
        {value}
      </div>
      <div className="text-[11px] text-paper/60 mt-1">{label}</div>
    </div>
  )
}
