'use client'
import { TrendingUp } from 'lucide-react'

interface Props {
  stats: { shared: number; accepted: number; percentile: number; totalMembers: number }
}

// Affiche les stats privees du chauffeur courant dans un groupe.
// Le percentile peut etre interprete differemment selon le rang. On formule
// toujours en positif pour ne pas humilier (cf. decision UX : pas de classement
// public). Si percentile <= 30 on montre "Top X%" ; sinon on cache la mention.
export function MyGroupStatsPanel({ stats }: Props) {
  const isTop = stats.percentile <= 30
  return (
    <section className="mb-3 rounded-2xl border border-warm-200 bg-paper p-4" aria-label="Mes stats privées dans ce groupe">
      <div className="flex items-start gap-3">
        <span className="w-9 h-9 rounded-xl bg-brand/15 text-ink grid place-items-center shrink-0">
          <TrendingUp className="w-4 h-4" strokeWidth={2} />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-warm-500 mb-1">
            Mes stats · privé
          </p>
          <p className="text-[13.5px] text-ink leading-snug">
            Tu as <strong>partagé {stats.shared}</strong> course{stats.shared > 1 ? 's' : ''}
            {' '}et <strong>accepté {stats.accepted}</strong> course{stats.accepted > 1 ? 's' : ''}
            {' '}dans ce groupe.
          </p>
          {isTop && (stats.shared + stats.accepted) > 0 && (
            <p className="text-[12px] text-emerald-700 mt-1 font-semibold">
              Top {stats.percentile}% du groupe sur l&apos;activité.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
