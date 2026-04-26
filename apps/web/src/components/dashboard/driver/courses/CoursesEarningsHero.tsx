'use client'
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react'
import { useCoursesEarningsHero } from './useCoursesEarningsHero'

export function CoursesEarningsHero() {
  const h = useCoursesEarningsHero()

  if (h.loading) {
    return <div className="h-[150px] rounded-3xl bg-warm-100 motion-safe:animate-pulse mb-4" />
  }

  const max = Math.max(1, ...h.weekSparkline.map((d) => d.earnings))

  return (
    <article
      className="relative overflow-hidden rounded-3xl mb-4 px-5 pt-4 pb-3.5 text-paper"
      style={{ background: 'linear-gradient(135deg, #1A1A1A 0%, #0E0E0E 100%)' }}
      aria-label="Gains du jour"
    >
      <div
        aria-hidden="true"
        className="absolute -top-10 -right-10 w-32 h-32 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(255,210,63,0.18) 0%, rgba(255,210,63,0) 70%)' }}
      />
      <div className="flex items-center gap-1.5 text-[11px] font-extrabold tracking-[0.08em] uppercase text-brand">
        <Wallet className="w-3.5 h-3.5" strokeWidth={2.4} />
        Gagné aujourd&apos;hui
      </div>
      <div className="mt-1 flex items-end gap-3">
        <span className="text-[34px] font-black leading-none tabular-nums tracking-tight">
          {h.todayEarnings.toFixed(0)}
          <span className="text-[22px] font-extrabold opacity-80 ml-0.5">€</span>
        </span>
        <span className="pb-1.5 text-[12px] text-paper/70">
          {h.todayCount} course{h.todayCount > 1 ? 's' : ''}
          {h.deltaPct !== null && (
            <span className={`ml-2 inline-flex items-center gap-0.5 font-bold ${h.deltaPct >= 0 ? 'text-[#10B981]' : 'text-[#FCA5A5]'}`}>
              {h.deltaPct >= 0
                ? <TrendingUp className="w-3.5 h-3.5" strokeWidth={2.4} />
                : <TrendingDown className="w-3.5 h-3.5" strokeWidth={2.4} />}
              {h.deltaPct >= 0 ? '+' : ''}{h.deltaPct}% vs hier
            </span>
          )}
        </span>
      </div>

      <div className="mt-3 flex items-end gap-1 h-[36px]" aria-hidden="true">
        {h.weekSparkline.map((d, i) => {
          const isToday = i === h.weekSparkline.length - 1
          const heightPct = Math.max(8, Math.round((d.earnings / max) * 100))
          return (
            <div
              key={d.date}
              className={`flex-1 rounded-t-[3px] ${isToday ? 'bg-brand' : 'bg-brand/40'}`}
              style={{ height: `${heightPct}%` }}
            />
          )
        })}
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px] text-paper/60 font-semibold">
        <span>Objectif {h.objective} €</span>
        <span>{h.objectiveProgressPct}%</span>
      </div>
      <div className="h-[3px] mt-1 rounded-full bg-paper/15 overflow-hidden">
        <div
          className="h-full rounded-full bg-brand transition-all"
          style={{ width: `${h.objectiveProgressPct}%` }}
        />
      </div>
    </article>
  )
}
