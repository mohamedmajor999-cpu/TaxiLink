'use client'
import { ArrowLeftRight, Clock } from 'lucide-react'
import { HoldAcceptButton } from './HoldAcceptButton'
import { RideBadge, type RideBadgeVariant } from './RideBadge'
import { RouteTimeline } from './RouteTimeline'
import { formatDuration } from '@/lib/formatDuration'

export interface CourseCardData {
  id: string
  urgent?: { etaMin: number }
  scheduledInMin?: number
  badges: { variant: RideBadgeVariant; label: string }[]
  from: { name: string; address?: string }
  to: { name: string; address?: string }
  distanceKm: number
  durationMin: number
  payment: 'CPAM' | 'CB' | 'Espèces'
  medicalMotif?: 'HDJ' | 'CONSULTATION' | null
  priceEur: number
  /** Si true, affiche le label "Prix estimé" au-dessus du montant. */
  priceIsEstimated?: boolean
  /** Fourchette optionnelle (privé) : si min != max, affichée à la place du prix unique. */
  priceMinEur?: number | null
  priceMaxEur?: number | null
  /** Nom abrégé du chauffeur qui a publié la mission (ex : "Jean D."). */
  publisher?: string | null
}

const MOTIF_LABEL: Record<'HDJ' | 'CONSULTATION', string> = {
  HDJ: 'Hôpital de jour',
  CONSULTATION: 'Consultation',
}

const DETAIL_BTN = 'bg-paper text-ink border border-warm-200 hover:bg-warm-50'

interface Props {
  course: CourseCardData
  onAccept?: (id: string) => void | Promise<void>
  onShowDetail?: (id: string) => void
  footer?: React.ReactNode
}

export function CourseCard({ course, onAccept, onShowDetail, footer }: Props) {
  const isUrgent = !!course.urgent
  const tier = getTimeTier(course.scheduledInMin)
  const cardStyle = `bg-paper border border-warm-200 rounded-lg md:rounded-xl overflow-hidden hover:border-warm-300 hover:shadow-soft transition-all h-full flex flex-col ${isUrgent ? 'shadow-soft' : ''}`

  return (
    <article className={cardStyle}>
      <div className="px-5 pt-2.5 pb-2.5 flex items-start justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {course.badges.map((b) => (
            <RideBadge key={b.label} variant={b.variant}>
              {b.label}
            </RideBadge>
          ))}
          {course.medicalMotif && course.payment === 'CPAM' && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
              {MOTIF_LABEL[course.medicalMotif]}
            </span>
          )}
        </div>

        <div className="text-right shrink-0">
          {isUrgent ? (
            <span className="inline-block bg-brand text-ink px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider">
              Urgent · {formatDuration(course.urgent!.etaMin)}
            </span>
          ) : (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border ${TIER_PILL[tier]}`}>
              {tier === 'imminent' && (
                <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-danger motion-safe:animate-pulse" />
              )}
              {typeof course.scheduledInMin === 'number' && course.scheduledInMin > 0
                ? `dans ${formatDuration(course.scheduledInMin)}`
                : 'maintenant'}
            </span>
          )}
        </div>
      </div>

      <div className="px-5 py-2.5 border-t border-warm-100">
        <div className="flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <RouteTimeline from={course.from} to={course.to} compact />
          </div>
          <div className="text-right shrink-0 whitespace-nowrap min-w-[64px]">
            {course.publisher && (
              <div className="text-[11px] font-semibold text-warm-600 mb-0.5 leading-none">
                {course.publisher}
              </div>
            )}
            {course.priceIsEstimated && (
              <div className="text-[9px] font-bold uppercase tracking-wider text-warm-500 mb-0.5 leading-none">
                Prix estimé
              </div>
            )}
            {hasRange(course) ? (
              <div className="text-[18px] font-bold leading-none text-ink tabular-nums tracking-tight">
                {course.priceMinEur}<span className="text-[13px] text-warm-500">–</span>{course.priceMaxEur}<span className="text-[13px]">€</span>
              </div>
            ) : (
              <div className="text-[26px] font-bold leading-none text-ink tabular-nums tracking-tight">
                {course.priceEur}<span className="text-[18px]">€</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-0.5 pl-[26px] text-[14px] text-ink font-semibold">
          <span className="inline-flex items-center gap-1">
            <ArrowLeftRight className="w-3.5 h-3.5" strokeWidth={1.8} />
            {course.distanceKm.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} km
          </span>
          <span aria-hidden="true" className="text-warm-300">·</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" strokeWidth={1.8} />
            {formatDuration(course.durationMin)}
          </span>
        </div>
      </div>

      <div className="px-5 pb-3 pt-1 mt-auto">
        {footer ?? (
          <div className="flex items-stretch gap-2">
            <div className="flex-1">
              <HoldAcceptButton
                variant={isUrgent ? 'accent' : 'default'}
                onConfirm={() => onAccept?.(course.id)}
              />
            </div>
            {onShowDetail && (
              <button
                type="button"
                onClick={() => onShowDetail(course.id)}
                aria-label="Voir les détails de la course"
                className={`shrink-0 h-[64px] inline-flex items-center justify-center px-5 rounded-xl text-[13px] font-semibold transition-colors ${DETAIL_BTN}`}
              >
                Détail
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  )
}

function hasRange(c: CourseCardData): c is CourseCardData & { priceMinEur: number; priceMaxEur: number } {
  return c.priceMinEur != null && c.priceMaxEur != null && c.priceMinEur !== c.priceMaxEur
}

type TimeTier = 'imminent' | 'soon' | 'far'

const TIER_PILL: Record<TimeTier, string> = {
  imminent: 'bg-danger-soft text-danger border-danger/20',
  soon: 'bg-amber-50 text-amber-700 border-amber-200',
  far: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

function getTimeTier(scheduledInMin: number | undefined): TimeTier {
  if (typeof scheduledInMin !== 'number' || scheduledInMin < 60) return 'imminent'
  if (scheduledInMin <= 180) return 'soon'
  return 'far'
}
