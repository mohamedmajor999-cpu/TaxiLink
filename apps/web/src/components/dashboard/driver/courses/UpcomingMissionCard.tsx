'use client'
import { Clock, User, Phone, ChevronRight, AlertTriangle } from 'lucide-react'
import type { Mission } from '@/lib/supabase/types'
import { formatMissionPrice } from '@/lib/formatMissionPrice'
import { getMinutesUntil } from '@/lib/dateUtils'

const URGENT_THRESHOLD_MIN = 15
const VERY_URGENT_THRESHOLD_MIN = 5

interface Props {
  mission: Mission
  dayPrefix?: string
  onShowDetails: (id: string) => void
}

export function UpcomingMissionCard({ mission, dayPrefix, onShowDetails }: Props) {
  const time = new Date(mission.scheduled_at).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })
  const minutesUntil = getMinutesUntil(mission.scheduled_at)
  const veryUrgent = minutesUntil <= VERY_URGENT_THRESHOLD_MIN && minutesUntil >= 0
  const urgent = !veryUrgent && minutesUntil <= URGENT_THRESHOLD_MIN && minutesUntil >= 0
  const isCpam = mission.type === 'CPAM'
  const typeLabel = isCpam ? 'CPAM' : 'Privé'
  const badgeClass = isCpam
    ? 'bg-[#DBEAFE] text-[#1E40AF]'
    : 'bg-[#F3E8FF] text-[#6B21A8]'
  const phoneHref = mission.phone ? `tel:${mission.phone}` : undefined
  const km = mission.distance_km
  const min = mission.duration_min
  const meta = [
    km != null ? `${km < 10 ? km.toFixed(1) : km.toFixed(0)} km` : null,
    min != null ? `${Math.round(min)} min` : null,
    mission.return_trip ? 'A/R' : null,
  ].filter(Boolean).join(' · ')
  const timeLabel = dayPrefix ? `${dayPrefix} ${time}` : time

  const cardClass = veryUrgent
    ? 'rounded-2xl border-2 border-[#EF4444] bg-[#FEF2F2] p-4 motion-safe:animate-[urgent-pulse_1.4s_ease-in-out_infinite]'
    : urgent
      ? 'rounded-2xl border-2 border-[#F59E0B] bg-[#FFFBEB] p-4'
      : 'rounded-2xl border border-warm-200 bg-paper p-4'

  return (
    <article className={cardClass}>
      <style>{`@keyframes urgent-pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.5); } 50% { box-shadow: 0 0 0 8px rgba(239,68,68,0); } }`}</style>
      <div className="flex items-center justify-between mb-2">
        <span className={`px-2 py-0.5 rounded text-[11px] font-extrabold uppercase tracking-[0.04em] ${badgeClass}`}>
          {typeLabel}
        </span>
        {(veryUrgent || urgent) ? (
          <span className={`inline-flex items-center gap-1 text-[12px] font-extrabold tabular-nums ${veryUrgent ? 'text-[#EF4444]' : 'text-[#B45309]'}`}>
            <AlertTriangle className="w-3.5 h-3.5" strokeWidth={2.2} />
            Dans {minutesUntil} min
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[12px] text-warm-500 font-semibold tabular-nums">
            <Clock className="w-3.5 h-3.5" strokeWidth={1.8} />
            {timeLabel}
          </span>
        )}
      </div>
      {mission.patient_name && (
        <div className="flex items-center gap-1.5 text-[13px] text-ink font-semibold mb-1 min-w-0">
          <User className="w-3.5 h-3.5 shrink-0" strokeWidth={1.8} />
          <span className="truncate">{mission.patient_name}</span>
        </div>
      )}
      <p className="text-[13.5px] font-semibold text-ink leading-[1.3] truncate">{mission.departure}</p>
      <p className="text-[13.5px] text-warm-500 leading-[1.3] truncate mt-0.5">{mission.destination}</p>
      <div className="flex items-end justify-between mt-3">
        <div>
          <div className="text-[18px] font-black text-ink leading-tight tabular-nums">
            {formatMissionPrice(mission)}
          </div>
          {meta && <div className="text-[11px] text-warm-500 mt-0.5 tabular-nums">{meta}</div>}
        </div>
        <div className="flex items-center gap-2">
          {phoneHref && (
            <a
              href={phoneHref}
              aria-label="Appeler le patient"
              className="w-9 h-9 rounded-lg border border-warm-200 bg-paper inline-flex items-center justify-center text-ink hover:bg-warm-50 transition-colors"
            >
              <Phone className="w-4 h-4" strokeWidth={1.8} />
            </a>
          )}
          <button
            type="button"
            onClick={() => onShowDetails(mission.id)}
            aria-label="Voir les details"
            className="w-9 h-9 rounded-lg border border-warm-200 bg-paper inline-flex items-center justify-center text-ink hover:bg-warm-50 transition-colors"
          >
            <ChevronRight className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>
      </div>
    </article>
  )
}
