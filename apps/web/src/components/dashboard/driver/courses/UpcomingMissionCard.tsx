'use client'
import { Clock, User, Phone, ChevronRight } from 'lucide-react'
import type { Mission } from '@/lib/supabase/types'
import { formatMissionPrice } from '@/lib/formatMissionPrice'

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

  return (
    <article className="rounded-2xl border border-warm-200 bg-paper p-4">
      <div className="flex items-center justify-between mb-2">
        <span className={`px-2 py-0.5 rounded text-[11px] font-extrabold uppercase tracking-[0.04em] ${badgeClass}`}>
          {typeLabel}
        </span>
        <span className="inline-flex items-center gap-1 text-[12px] text-warm-500 font-semibold tabular-nums">
          <Clock className="w-3.5 h-3.5" strokeWidth={1.8} />
          {timeLabel}
        </span>
      </div>
      {mission.patient_name && (
        <div className="inline-flex items-center gap-1.5 text-[13px] text-ink font-semibold mb-1">
          <User className="w-3.5 h-3.5" strokeWidth={1.8} />
          {mission.patient_name}
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
