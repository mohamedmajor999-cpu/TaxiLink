'use client'
import { AlertTriangle, MapPin, Route } from 'lucide-react'
import type { Mission } from '@/lib/supabase/types'
import { computeDisplayFare } from '@/lib/missionFare'
import { getMinutesUntil } from '@/lib/dateUtils'
import { formatDuration } from '@/lib/formatDuration'
import { haversineKm } from '@/lib/geoDistance'

const URGENT_THRESHOLD_MIN = 10

// Code couleur de l'imminence de la course :
// rouge < 10 min, orange < 1h, noir < 24h, gris au-dela.
function delayColorClass(minutes: number): string {
  if (minutes <= URGENT_THRESHOLD_MIN) return 'text-[#EF4444]'
  if (minutes < 60) return 'text-[#F59E0B]'
  if (minutes < 1440) return 'text-ink'
  return 'text-warm-500'
}

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
  const pickupKm = userCoords && mission.departure_lat != null && mission.departure_lng != null
    ? haversineKm(userCoords, { lat: mission.departure_lat, lng: mission.departure_lng })
    : null
  const courseKm = mission.distance_km != null
    ? mission.distance_km
    : (mission.departure_lat != null && mission.departure_lng != null
        && mission.destination_lat != null && mission.destination_lng != null)
      ? haversineKm(
          { lat: mission.departure_lat, lng: mission.departure_lng },
          { lat: mission.destination_lat, lng: mission.destination_lng },
        )
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
      className={`w-full text-left rounded-2xl bg-paper transition-colors ${
        selected
          ? 'border-2 border-ink shadow-[0_6px_16px_rgba(0,0,0,0.1)] p-[13px]'
          : 'border border-warm-200 hover:border-warm-300 p-3.5'
      }`}
    >
      <div className="flex gap-2.5 items-start">
        <div className="flex-1 min-w-0">
          <div className="grid grid-cols-[14px_1fr] gap-x-3 items-center">
            <span className="w-2.5 h-2.5 rounded-full bg-ink justify-self-center" />
            <p className="text-[14px] font-semibold text-ink truncate leading-[1.3]">{mission.departure}</p>
            <span className="w-0.5 h-3 bg-warm-200 justify-self-center my-0.5" />
            <span className="h-3" aria-hidden="true" />
            <span className="w-3 h-3 rounded-full bg-brand border-2 border-ink justify-self-center" />
            <p className="text-[14px] text-warm-500 font-medium truncate leading-[1.3]">{mission.destination}</p>
          </div>
          <div className="flex items-center gap-1.5 mt-2 pl-[26px] min-w-0 overflow-hidden whitespace-nowrap">
            <span className={`shrink-0 px-1.5 py-[2px] rounded text-[10px] font-extrabold uppercase tracking-[0.04em] ${badgeClass}`}>
              {typeLabel}
            </span>
            <span className={`shrink-0 text-[11px] font-bold ${delayColorClass(minutesUntil)}`}>
              · {minutesUntil <= 0 ? 'Maintenant' : `Dans ${formatDuration(minutesUntil)}`}
              {mission.return_trip ? ' · A/R' : ''}
            </span>
            {urgent && (
              <span className="shrink-0 inline-flex items-center gap-0.5 text-[10.5px] font-extrabold text-[#EF4444]">
                <AlertTriangle className="w-3 h-3" strokeWidth={2.2} />
                Urgent
              </span>
            )}
          </div>
        </div>
        <div className="text-right shrink-0 flex flex-col items-end gap-0.5">
          <div className="text-[16px] font-black text-ink tabular-nums leading-tight">
            {fare.value.toFixed(2).replace('.', ',')} €
          </div>
          {pickupKm != null && (
            <div
              className="inline-flex items-center gap-1 text-[11px] text-warm-500 font-semibold tabular-nums"
              title="Distance jusqu'au lieu de prise en charge"
            >
              <MapPin className="w-3 h-3" strokeWidth={2.2} />
              {pickupKm < 10 ? pickupKm.toFixed(1) : pickupKm.toFixed(0)} km
            </div>
          )}
          {courseKm != null && (
            <div
              className="inline-flex items-center gap-1 text-[11px] text-ink font-semibold tabular-nums"
              title="Distance de la course (depart > destination)"
            >
              <Route className="w-3 h-3" strokeWidth={2.2} />
              {courseKm < 10 ? courseKm.toFixed(1) : courseKm.toFixed(0)} km
            </div>
          )}
        </div>
      </div>
    </button>
  )
}
