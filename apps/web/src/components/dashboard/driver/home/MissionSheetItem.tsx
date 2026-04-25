'use client'
import { AlertTriangle } from 'lucide-react'
import type { Mission } from '@/lib/supabase/types'
import { computeDisplayFare } from '@/lib/missionFare'
import { getMinutesUntil } from '@/lib/dateUtils'
import { haversineKm } from '@/lib/geoDistance'

const URGENT_THRESHOLD_MIN = 10

interface Props {
  mission: Mission
  selected: boolean
  userCoords: { lat: number; lng: number } | null
  onSelect: (id: string) => void
}

export function MissionSheetItem({ mission, selected, userCoords, onSelect }: Props) {
  const fare = computeDisplayFare(mission)
  const minutesUntil = getMinutesUntil(mission.scheduled_at)
  const urgent = minutesUntil <= URGENT_THRESHOLD_MIN
  const distanceKm = userCoords && mission.departure_lat != null && mission.departure_lng != null
    ? haversineKm(userCoords, { lat: mission.departure_lat, lng: mission.departure_lng })
    : null
  const isCpam = mission.type === 'CPAM'
  const typeLabel = isCpam ? 'CPAM' : 'Privé'
  const badgeClass = isCpam
    ? 'bg-[#DBEAFE] text-[#1E40AF]'
    : 'bg-[#F3E8FF] text-[#6B21A8]'

  return (
    <button
      type="button"
      data-mission={mission.id}
      onClick={() => onSelect(mission.id)}
      aria-pressed={selected}
      className={`w-full text-left flex gap-3 rounded-2xl bg-paper transition-colors ${
        selected
          ? 'border-2 border-ink shadow-[0_6px_16px_rgba(0,0,0,0.1)] p-[13px]'
          : 'border border-warm-200 hover:border-warm-300 p-3.5'
      }`}
    >
      <div className="flex flex-col items-center pt-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-ink" />
        <span className="w-0.5 flex-1 min-h-[22px] bg-warm-200 my-1" />
        <span className="w-3 h-3 rounded-full bg-brand border-2 border-ink" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] font-semibold text-ink truncate leading-[1.3]">{mission.departure}</p>
        <p className="text-[13.5px] text-warm-500 font-medium truncate mt-0.5 leading-[1.3]">{mission.destination}</p>
        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
          <span className={`px-1.5 py-[2px] rounded text-[10px] font-extrabold uppercase tracking-[0.04em] ${badgeClass}`}>
            {typeLabel}
          </span>
          <span className="text-[11px] font-semibold text-warm-500">
            · {minutesUntil <= 0 ? 'Maintenant' : `Dans ${minutesUntil} min`}
            {mission.return_trip ? ' · A/R' : ''}
          </span>
          {urgent && (
            <span className="inline-flex items-center gap-0.5 text-[10.5px] font-extrabold text-[#EF4444]">
              <AlertTriangle className="w-3 h-3" strokeWidth={2.2} />
              Urgent
            </span>
          )}
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-[16px] font-black text-ink tabular-nums leading-tight">
          {fare.value.toFixed(2).replace('.', ',')} €
        </div>
        {distanceKm != null && (
          <div className="text-[10.5px] text-warm-500 font-semibold mt-0.5 tabular-nums">
            {distanceKm < 10 ? distanceKm.toFixed(1) : distanceKm.toFixed(0)} km
          </div>
        )}
      </div>
    </button>
  )
}
