'use client'
import { ArrowLeftRight, Clock } from 'lucide-react'
import { HoldAcceptButton } from './HoldAcceptButton'
import { RideBadge, type RideBadgeVariant } from './RideBadge'
import { RouteTimeline } from './RouteTimeline'

export interface CourseCardData {
  id: string
  urgent?: { etaMin: number }
  badges: { variant: RideBadgeVariant; label: string }[]
  postedBy: { initials: string; name: string; whenLabel?: string }
  from: { name: string; address?: string }
  to: { name: string; address?: string }
  distanceKm: number
  durationMin: number
  payment: 'CPAM' | 'CB' | 'Espèces'
  priceEur: number
}

interface Props {
  course: CourseCardData
  onAccept: (id: string) => void | Promise<void>
}

export function CourseCard({ course, onAccept }: Props) {
  const isUrgent = !!course.urgent
  const cardStyle = isUrgent
    ? 'bg-paper border-2 border-ink rounded-2xl overflow-hidden shadow-soft'
    : 'bg-paper border border-warm-200 rounded-2xl overflow-hidden shadow-soft hover:shadow-card transition-shadow'

  return (
    <article className={cardStyle}>
      {isUrgent && (
        <div className="bg-brand text-ink px-3 py-1 text-[11px] font-bold uppercase tracking-wider">
          Urgent · dans {course.urgent!.etaMin} min
        </div>
      )}

      <div className="px-5 pt-4 flex items-start justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {course.badges.map((b) => (
            <RideBadge key={b.label} variant={b.variant}>
              {b.label}
            </RideBadge>
          ))}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-5 h-5 rounded-full bg-warm-100 flex items-center justify-center text-[10px] font-semibold text-ink">
            {course.postedBy.initials}
          </div>
          <span className="text-xs text-warm-600">
            De {course.postedBy.name}
            {course.postedBy.whenLabel && ` · ${course.postedBy.whenLabel}`}
          </span>
        </div>
      </div>

      <div className="px-5 pt-4 grid grid-cols-[1fr_auto] gap-4 items-start">
        <RouteTimeline from={course.from} to={course.to} />
        <div className="text-right">
          <div className="font-serif text-[34px] leading-none text-ink">
            {course.priceEur}
            <span className="text-base align-top font-sans">€</span>
          </div>
        </div>
      </div>

      <div className="px-5 pt-3 pb-4 flex items-center gap-3 text-[12px] text-warm-500">
        <span className="inline-flex items-center gap-1">
          <ArrowLeftRight className="w-3.5 h-3.5" strokeWidth={1.6} />
          {course.distanceKm.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} km
        </span>
        <span aria-hidden="true">·</span>
        <span className="inline-flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" strokeWidth={1.6} />
          {course.durationMin} min
        </span>
        <span aria-hidden="true">·</span>
        <span className="font-semibold text-ink">{course.payment}</span>
      </div>

      <div className="px-5 pb-5">
        <HoldAcceptButton
          variant={isUrgent ? 'accent' : 'default'}
          onConfirm={() => onAccept(course.id)}
        />
      </div>
    </article>
  )
}
