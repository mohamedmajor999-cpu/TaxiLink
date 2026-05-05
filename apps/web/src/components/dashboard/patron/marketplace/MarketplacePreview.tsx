'use client'
import { Icon } from '@/components/ui/Icon'
import { usePatronMarketplace } from './usePatronMarketplace'
import type { MarketplaceCourse } from '@/services/patronMarketplaceService'

interface Props {
  onGoToMarketplace?: () => void
  limit?: number
}

export function MarketplacePreview({ onGoToMarketplace, limit = 5 }: Props) {
  const { items, isLoading } = usePatronMarketplace()
  const top = items.slice(0, limit)

  return (
    <section className="rounded-2xl border border-warm-200 dark:border-night-border bg-paper dark:bg-night-surface p-4">
      <header className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <Icon name="campaign" size={18} />
          <h2 className="text-sm font-bold text-ink dark:text-night-text">Annonces disponibles</h2>
          <span className="text-[11px] text-warm-600 dark:text-night-text-soft tabular-nums">({items.length})</span>
        </div>
        {onGoToMarketplace && items.length > 0 && (
          <button
            type="button"
            onClick={onGoToMarketplace}
            className="text-xs font-bold text-ink dark:text-night-brand hover:underline shrink-0"
          >
            Voir toutes →
          </button>
        )}
      </header>

      {isLoading ? (
        <p className="text-xs text-warm-600 dark:text-night-text-soft py-4 text-center">Chargement…</p>
      ) : top.length === 0 ? (
        <div className="py-6 text-center">
          <p className="text-xs text-warm-600 dark:text-night-text-soft">Aucune annonce disponible</p>
        </div>
      ) : (
        <ul className="divide-y divide-warm-100 dark:divide-night-border -mx-2">
          {top.map((c) => (
            <PreviewRow key={c.id} course={c} onClick={onGoToMarketplace} />
          ))}
        </ul>
      )}
    </section>
  )
}

function PreviewRow({ course, onClick }: { course: MarketplaceCourse; onClick?: () => void }) {
  const visClass = course.visibility === 'PUBLIC'
    ? 'bg-blue-500/15 text-blue-700 dark:text-blue-400'
    : 'bg-purple-500/15 text-purple-700 dark:text-purple-400'
  const visLabel = course.visibility === 'PUBLIC' ? 'PUBLIC' : (course.group_names[0] ?? 'GROUPE')
  const Wrapper: React.ElementType = onClick ? 'button' : 'div'
  return (
    <li>
      <Wrapper
        type={onClick ? 'button' : undefined}
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-2 py-2.5 text-left ${onClick ? 'hover:bg-warm-50 dark:hover:bg-night-elevated' : ''}`}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${visClass}`}>{visLabel.length > 14 ? visLabel.slice(0, 12) + '…' : visLabel}</span>
            <span className="text-[10px] text-warm-600 dark:text-night-text-soft">{course.scheduled_label}</span>
          </div>
          <p className="text-xs text-ink dark:text-night-text font-medium truncate">{short(course.departure)} → {short(course.destination)}</p>
        </div>
        {course.price_eur != null && (
          <span className="text-sm font-bold text-ink dark:text-night-text tabular-nums shrink-0">{course.price_eur} €</span>
        )}
      </Wrapper>
    </li>
  )
}

function short(s: string): string {
  return s.split(',')[0].trim() || s
}
