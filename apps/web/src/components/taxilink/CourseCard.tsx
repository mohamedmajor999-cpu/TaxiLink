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
  clientName?: string
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
}

const MOTIF_LABEL: Record<'HDJ' | 'CONSULTATION', string> = {
  HDJ: 'HDJ',
  CONSULTATION: 'Consult.',
}

interface Props {
  course: CourseCardData
  onAccept?: (id: string) => void | Promise<void>
  footer?: React.ReactNode
}

export function CourseCard({ course, onAccept, footer }: Props) {
  const isUrgent = !!course.urgent
  const tier = getTimeTier(course.scheduledInMin)
  const cardStyle = `bg-paper border border-warm-200 rounded-2xl overflow-hidden hover:border-warm-300 hover:shadow-soft transition-all h-full flex flex-col ${isUrgent ? 'shadow-soft' : ''}`

  return (
    <article className={cardStyle}>
      <div className="px-5 pt-4 flex items-start justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {course.badges.map((b) => (
            <RideBadge key={b.label} variant={b.variant}>
              {b.label}
            </RideBadge>
          ))}
        </div>

        {isUrgent ? (
          <div className="text-right shrink-0">
            <span className="inline-block bg-brand text-ink px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
              Urgent · {formatDuration(course.urgent!.etaMin)}
            </span>
            {course.clientName && (
              <div className="text-[12px] text-warm-600 mt-1">{course.clientName}</div>
            )}
          </div>
        ) : (
          <div className="shrink-0 inline-flex items-center gap-1.5 text-[12px] text-warm-500">
            <span aria-hidden="true" className={`w-1.5 h-1.5 rounded-full ${TIER_DOT[tier]}`} />
            <span>
              {typeof course.scheduledInMin === 'number' && course.scheduledInMin > 0
                ? `dans ${formatDuration(course.scheduledInMin)}`
                : 'maintenant'}
              {course.clientName && <> · <span className="text-warm-600">{course.clientName}</span></>}
            </span>
          </div>
        )}
      </div>

      <div className="px-5 pt-4 grid grid-cols-[minmax(0,1fr)_auto] gap-4 items-start">
        <RouteTimeline from={course.from} to={course.to} compact />
        <div className="text-right shrink-0 whitespace-nowrap min-w-[72px] translate-x-[-20px] translate-y-[20px]">
          {course.priceIsEstimated && (
            <div className="text-[9px] font-bold uppercase tracking-wider text-warm-500 mb-0.5 leading-none">
              Prix estimé
            </div>
          )}
          {hasRange(course) ? (
            <div className="text-[20px] font-bold leading-none text-ink tabular-nums tracking-tight">
              {course.priceMinEur}<span className="text-[15px] text-warm-500">–</span>{course.priceMaxEur}<span className="text-[15px]">€</span>
            </div>
          ) : (
            <div className="text-[28px] font-bold leading-none text-ink tabular-nums tracking-tight">
              {course.priceEur}<span className="text-[20px]">€</span>
            </div>
          )}
        </div>
      </div>

      <div className="px-5 pt-3 pb-4 flex items-center gap-3 text-[14px] text-ink">
        <span className="inline-flex items-center gap-1.5 tabular-nums font-semibold">
          <ArrowLeftRight className="w-4 h-4" strokeWidth={1.8} />
          {course.distanceKm.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} km
        </span>
        <span aria-hidden="true" className="text-warm-300">·</span>
        <span className="inline-flex items-center gap-1.5 tabular-nums font-semibold">
          <Clock className="w-4 h-4" strokeWidth={1.8} />
          {formatDuration(course.durationMin)}
        </span>
        {course.medicalMotif && course.payment === 'CPAM' && (
          <>
            <span aria-hidden="true" className="text-warm-300">·</span>
            <span className="font-semibold text-ink">{MOTIF_LABEL[course.medicalMotif]}</span>
          </>
        )}
      </div>

      <div className="px-5 pb-5 mt-auto">
        {footer ?? (
          <HoldAcceptButton
            variant={isUrgent ? 'accent' : 'default'}
            onConfirm={() => onAccept?.(course.id)}
          />
        )}
      </div>
    </article>
  )
}

function hasRange(c: CourseCardData): c is CourseCardData & { priceMinEur: number; priceMaxEur: number } {
  return c.priceMinEur != null && c.priceMaxEur != null && c.priceMinEur !== c.priceMaxEur
}

type TimeTier = 'imminent' | 'soon' | 'far'

const TIER_DOT: Record<TimeTier, string> = {
  imminent: 'bg-danger motion-safe:animate-pulse',
  soon: 'bg-amber-500',
  far: 'bg-emerald-500',
}

function getTimeTier(scheduledInMin: number | undefined): TimeTier {
  if (typeof scheduledInMin !== 'number' || scheduledInMin < 60) return 'imminent'
  if (scheduledInMin <= 180) return 'soon'
  return 'far'
}
