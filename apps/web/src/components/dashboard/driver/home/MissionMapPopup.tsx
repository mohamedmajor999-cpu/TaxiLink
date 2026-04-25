'use client'
import { AlertTriangle, MapPin, Route, X } from 'lucide-react'
import type { Mission } from '@/lib/supabase/types'
import { computeDisplayFare } from '@/lib/missionFare'
import { getMinutesUntil } from '@/lib/dateUtils'
import { formatDuration } from '@/lib/formatDuration'
import { haversineKm } from '@/lib/geoDistance'
import { HoldAcceptButton } from '@/components/taxilink/HoldAcceptButton'

const URGENT_THRESHOLD_MIN = 10

interface Props {
  mission: Mission
  userCoords: { lat: number; lng: number } | null
  onAccept: () => void | Promise<void>
  onShowDetail: () => void
  onClose: () => void
}

export function MissionMapPopup({ mission, userCoords, onAccept, onShowDetail, onClose }: Props) {
  const fare = computeDisplayFare(mission)
  const minutesUntil = getMinutesUntil(mission.scheduled_at)
  const urgent = minutesUntil <= URGENT_THRESHOLD_MIN
  const pickupKm = userCoords && mission.departure_lat != null && mission.departure_lng != null
    ? haversineKm(userCoords, { lat: mission.departure_lat, lng: mission.departure_lng })
    : null
  const courseKm = mission.distance_km ?? null
  const isCpam = mission.type === 'CPAM'
  const typeLabel = isCpam ? 'CPAM' : 'Privé'
  const badgeClass = isCpam ? 'bg-[#DBEAFE] text-[#1E40AF]' : 'bg-[#F3E8FF] text-[#6B21A8]'

  return (
    <div
      role="dialog"
      aria-label="Détails de la course sélectionnée"
      className="absolute left-3 right-3 bottom-3 z-[600] rounded-2xl bg-paper dark:bg-warm-800 border border-warm-200 dark:border-warm-600 shadow-[0_-8px_30px_rgba(0,0,0,0.18)] p-4 motion-safe:animate-[popup-in_280ms_cubic-bezier(0.34,1.56,0.64,1)]"
      style={{
        animation: 'popup-in 280ms cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      <style>{`@keyframes popup-in { 0% { transform: translateY(20px); opacity: 0 } 100% { transform: translateY(0); opacity: 1 } }`}</style>
      <button
        type="button"
        onClick={onClose}
        aria-label="Fermer"
        className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-warm-100 dark:bg-warm-600 hover:bg-warm-200 dark:hover:bg-warm-500 flex items-center justify-center text-ink dark:text-paper transition-colors"
      >
        <X className="w-4 h-4" strokeWidth={2.4} />
      </button>

      <div className="flex gap-3 items-start pr-8">
        <div className="flex-1 min-w-0">
          <div className="grid grid-cols-[14px_1fr] gap-x-3 items-center">
            <span className="w-2.5 h-2.5 rounded-full bg-ink justify-self-center" />
            <p className="text-[15px] font-semibold text-ink dark:text-paper truncate leading-[1.3]">{mission.departure}</p>
            <span className="w-0.5 h-3.5 bg-warm-200 justify-self-center my-0.5" />
            <span className="h-3.5" aria-hidden="true" />
            <span className="w-3 h-3 rounded-full bg-brand border-2 border-ink justify-self-center" />
            <p className="text-[15px] text-warm-500 font-medium truncate leading-[1.3]">{mission.destination}</p>
          </div>
          <div className="flex items-center gap-1.5 mt-2.5 flex-wrap pl-[26px]">
            <span className={`px-1.5 py-[2px] rounded text-[10.5px] font-extrabold uppercase tracking-[0.04em] ${badgeClass}`}>
              {typeLabel}
            </span>
            <span className="text-[12px] font-bold text-warm-600">
              · {minutesUntil <= 0 ? 'Maintenant' : `Dans ${formatDuration(minutesUntil)}`}
              {mission.return_trip ? ' · A/R' : ''}
            </span>
            {urgent && (
              <span className="inline-flex items-center gap-0.5 text-[11px] font-extrabold text-[#EF4444]">
                <AlertTriangle className="w-3 h-3" strokeWidth={2.2} />
                Urgent
              </span>
            )}
          </div>
        </div>
        <div className="text-right shrink-0 flex flex-col items-end gap-1">
          <div className="text-[20px] font-black text-ink dark:text-brand tabular-nums leading-tight">
            {fare.value.toFixed(2).replace('.', ',')} €
          </div>
          {pickupKm != null && (
            <div className="inline-flex items-center gap-1 text-[12px] text-warm-500 font-semibold tabular-nums">
              <MapPin className="w-3.5 h-3.5" strokeWidth={2.2} />
              {pickupKm < 10 ? pickupKm.toFixed(1) : pickupKm.toFixed(0)} km
            </div>
          )}
          {courseKm != null && (
            <div className="inline-flex items-center gap-1 text-[12px] text-ink font-semibold tabular-nums">
              <Route className="w-3.5 h-3.5" strokeWidth={2.2} />
              {courseKm < 10 ? courseKm.toFixed(1) : courseKm.toFixed(0)} km
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 mt-3">
        <div className="flex-1 min-w-0">
          <HoldAcceptButton onConfirm={onAccept} />
        </div>
        <button
          type="button"
          onClick={onShowDetail}
          aria-label="Voir les détails complets"
          className="shrink-0 h-[52px] px-3 rounded-xl bg-paper border border-warm-200 inline-flex items-center justify-center text-ink text-[12px] font-bold hover:bg-brand hover:border-ink transition-colors"
        >
          Détail
        </button>
      </div>
    </div>
  )
}
