'use client'
import { ArrowLeftRight, Clock } from 'lucide-react'
import { HoldAcceptButton } from './HoldAcceptButton'
import { RideBadge, type RideBadgeVariant } from './RideBadge'
import { RouteTimeline } from './RouteTimeline'

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
  const cardStyle = isUrgent
    ? 'bg-paper border-2 border-ink rounded-2xl overflow-hidden shadow-soft'
    : 'bg-paper border border-warm-200 rounded-2xl overflow-hidden hover:shadow-soft transition-shadow'

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
              Urgent · {course.urgent!.etaMin} min
            </span>
            {course.clientName && (
              <div className="text-[12px] text-warm-600 mt-1">{course.clientName}</div>
            )}
          </div>
        ) : (
          <div className="text-right shrink-0 text-[12px] text-warm-500">
            {typeof course.scheduledInMin === 'number' && course.scheduledInMin > 0
              ? `dans ${course.scheduledInMin} min`
              : 'maintenant'}
            {course.clientName && <> · <span className="text-warm-600">{course.clientName}</span></>}
          </div>
        )}
      </div>

      <div className="px-5 pt-4 grid grid-cols-[1fr_auto] gap-3 items-end">
        <RouteTimeline from={course.from} to={course.to} compact />
        <div className="text-right shrink-0 whitespace-nowrap">
          {course.priceIsEstimated && (
            <div className="text-[9px] font-bold uppercase tracking-wider text-warm-500 mb-0.5">
              Prix estimé
            </div>
          )}
          <div className="text-[28px] font-bold leading-none text-ink tabular-nums tracking-tight">
            {course.priceEur}<span className="text-[20px]">€</span>
          </div>
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
          {course.durationMin} min
        </span>
        <span aria-hidden="true" className="text-warm-300">·</span>
        <span className="font-semibold text-ink">
          {course.payment}
          {course.medicalMotif && course.payment === 'CPAM' && (
            <span className="text-warm-500 font-medium"> · {MOTIF_LABEL[course.medicalMotif]}</span>
          )}
        </span>
      </div>

      <div className="px-5 pb-5">
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
