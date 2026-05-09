'use client'
import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, MapPin, Megaphone, Route, X } from 'lucide-react'
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
  /**
   * Si défini, affiche une barre de progression qui se vide en N ms et appelle
   * `onAutoDismiss` à la fin. Utilisé pour les nouvelles annonces postées en
   * temps réel (alerte avec décompte 10s).
   */
  autoDismissMs?: number
  onAutoDismiss?: () => void
  /** Mission postee par le user lui-meme : remplace l'Accept par 'Votre annonce'. */
  ownMission?: boolean
}

export function MissionMapPopup({ mission, userCoords, onAccept, onShowDetail, onClose, autoDismissMs, onAutoDismiss, ownMission }: Props) {
  const [progress, setProgress] = useState(100)
  // Stabilise onAutoDismiss via une ref : sinon, comme la callback est recreee
  // a chaque render dans le parent (DriverHome), le useEffect se relancerait
  // en boucle, resetant progress a 100 et faisant osciller la barre.
  const onAutoDismissRef = useRef(onAutoDismiss)
  onAutoDismissRef.current = onAutoDismiss
  useEffect(() => {
    if (!autoDismissMs) return
    setProgress(100)
    const startedAt = Date.now()
    const id = window.setInterval(() => {
      const elapsed = Date.now() - startedAt
      const ratio = Math.max(0, 1 - elapsed / autoDismissMs)
      setProgress(ratio * 100)
      if (ratio <= 0) {
        window.clearInterval(id)
        onAutoDismissRef.current?.()
      }
    }, 80)
    return () => window.clearInterval(id)
  }, [mission.id, autoDismissMs])

  const fare = computeDisplayFare(mission)
  const minutesUntil = getMinutesUntil(mission.scheduled_at)
  const urgent = minutesUntil <= URGENT_THRESHOLD_MIN
  const pickupKm = userCoords && mission.departure_lat != null && mission.departure_lng != null
    ? haversineKm(userCoords, { lat: mission.departure_lat, lng: mission.departure_lng })
    : null
  const courseKm = mission.distance_km ?? null
  const isCpam = mission.type === 'CPAM'
  const typeLabel = isCpam ? 'CPAM' : 'Privé'
  const badgeClass = isCpam ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-900'
  const isStale = mission.status === 'STALE'

  const isIncoming = autoDismissMs != null

  return (
    <div
      role="dialog"
      aria-label={isIncoming ? 'Nouvelle course publiée' : 'Détails de la course sélectionnée'}
      className={
        isIncoming
          ? 'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-24px)] max-w-md z-[1200] rounded-2xl bg-paper dark:bg-night-elevated border border-warm-200 dark:border-night-border shadow-[0_24px_64px_rgba(0,0,0,0.28)] p-4 motion-safe:animate-[popup-in-center_320ms_cubic-bezier(0.34,1.56,0.64,1)]'
          : 'absolute left-3 right-3 bottom-[calc(env(safe-area-inset-bottom)+12px)] z-[1100] rounded-2xl bg-paper dark:bg-night-elevated border border-warm-200 dark:border-night-border shadow-[0_-8px_30px_rgba(0,0,0,0.18)] p-4 motion-safe:animate-[popup-in_280ms_cubic-bezier(0.34,1.56,0.64,1)]'
      }
    >
      <style>{`
        @keyframes popup-in { 0% { transform: translateY(20px); opacity: 0 } 100% { transform: translateY(0); opacity: 1 } }
        @keyframes popup-in-center { 0% { transform: translate(-50%, -50%) scale(0.9); opacity: 0 } 100% { transform: translate(-50%, -50%) scale(1); opacity: 1 } }
      `}</style>
      <button
        type="button"
        onClick={onClose}
        aria-label="Fermer"
        className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-warm-100 dark:bg-night-surface hover:bg-warm-200 dark:hover:bg-night-border flex items-center justify-center text-ink dark:text-night-text transition-colors"
      >
        <X className="w-4 h-4" strokeWidth={2.4} />
      </button>

      <div className="flex gap-3 items-start pr-8">
        <div className="flex-1 min-w-0">
          <div className="grid grid-cols-[14px_1fr] gap-x-3 items-center">
            <span className="w-2.5 h-2.5 rounded-full bg-ink dark:bg-night-text justify-self-center" />
            <p className="text-[15px] font-semibold text-ink dark:text-night-text truncate leading-[1.3]">{mission.departure}</p>
            <span className="w-0.5 h-3.5 bg-warm-200 dark:bg-night-border justify-self-center my-0.5" />
            <span className="h-3.5" aria-hidden="true" />
            <span className="w-3 h-3 rounded-full bg-brand dark:bg-night-brand border-2 border-ink dark:border-night-text justify-self-center" />
            <p className="text-[15px] text-warm-500 dark:text-night-text-soft font-medium truncate leading-[1.3]">{mission.destination}</p>
          </div>
          <div className="flex items-center gap-1.5 mt-2.5 flex-wrap pl-[26px]">
            <span className={`px-1.5 py-[2px] rounded text-[10.5px] font-extrabold uppercase tracking-[0.04em] ${badgeClass}`}>
              {typeLabel}
            </span>
            <span className="text-[12px] font-bold text-warm-600 dark:text-night-text-soft">
              · {minutesUntil <= 0 ? 'Maintenant' : `Dans ${formatDuration(minutesUntil)}`}
              {mission.return_trip ? ' · A/R' : ''}
            </span>
            {urgent && (
              <span className="inline-flex items-center gap-0.5 text-[11px] font-extrabold text-red-500">
                <AlertTriangle className="w-3 h-3" strokeWidth={2.2} />
                Urgent
              </span>
            )}
            {isStale && (
              <span className="inline-flex items-center gap-0.5 text-[10.5px] font-extrabold uppercase tracking-[0.04em] px-1.5 py-[2px] rounded bg-amber-100 text-amber-900">
                À republier
              </span>
            )}
          </div>
        </div>
        <div className="text-right shrink-0 flex flex-col items-end gap-1">
          <div className="text-[20px] font-black text-ink dark:text-night-brand tabular-nums leading-tight">
            {fare.value.toFixed(2).replace('.', ',')} €
          </div>
          {pickupKm != null && (
            <div className="inline-flex items-center gap-1 text-[12px] text-warm-500 dark:text-night-text-soft font-semibold tabular-nums">
              <MapPin className="w-3.5 h-3.5" strokeWidth={2.2} />
              {pickupKm < 10 ? pickupKm.toFixed(1) : pickupKm.toFixed(0)} km
            </div>
          )}
          {courseKm != null && (
            <div className="inline-flex items-center gap-1 text-[12px] text-ink dark:text-night-text font-semibold tabular-nums">
              <Route className="w-3.5 h-3.5" strokeWidth={2.2} />
              {courseKm < 10 ? courseKm.toFixed(1) : courseKm.toFixed(0)} km
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 mt-3">
        <div className="flex-1 min-w-0">
          {ownMission ? (
            <div
              role="status"
              aria-label="Votre annonce, vous ne pouvez pas l'accepter"
              className="w-full h-[52px] rounded-xl bg-brand/15 border-2 border-dashed border-brand text-ink font-extrabold text-[13px] inline-flex items-center justify-center gap-2"
            >
              <Megaphone className="w-4 h-4" strokeWidth={2.4} />
              Votre annonce
            </div>
          ) : (
            <HoldAcceptButton onConfirm={onAccept} />
          )}
        </div>
        <button
          type="button"
          onClick={onShowDetail}
          aria-label="Voir les détails complets"
          className="shrink-0 h-[52px] px-3 rounded-xl bg-paper dark:bg-night-elevated border border-warm-200 dark:border-night-border inline-flex items-center justify-center text-ink dark:text-night-text text-[12px] font-bold hover:bg-brand hover:border-ink dark:hover:bg-night-border transition-colors"
        >
          Détail
        </button>
      </div>

      {autoDismissMs && (
        <div className="absolute left-0 right-0 bottom-0 h-1 bg-warm-200 dark:bg-night-border overflow-hidden rounded-b-2xl" aria-hidden="true">
          <div
            className="h-full bg-brand dark:bg-night-brand transition-[width] ease-linear"
            style={{ width: `${progress}%`, transitionDuration: '80ms' }}
          />
        </div>
      )}
    </div>
  )
}
