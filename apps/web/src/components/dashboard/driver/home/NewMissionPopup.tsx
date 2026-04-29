'use client'
import { useEffect, useState } from 'react'
import { X, MapPin, Navigation, Clock } from 'lucide-react'
import type { Mission } from '@/lib/supabase/types'
import { haversineKm, type LatLng } from '@/lib/geoDistance'
import { computeDisplayFare } from '@/lib/missionFare'

interface Props {
  mission: Mission
  userCoords: LatLng | null
  onAccept: () => void
  onDetail: () => void
  onDismiss: () => void
  /** Durée en ms avant auto-dismiss (default 10s). */
  durationMs?: number
}

const DEFAULT_DURATION_MS = 10_000

export function NewMissionPopup({ mission, userCoords, onAccept, onDetail, onDismiss, durationMs = DEFAULT_DURATION_MS }: Props) {
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    const startedAt = Date.now()
    const tick = () => {
      const elapsed = Date.now() - startedAt
      const ratio = Math.max(0, 1 - elapsed / durationMs)
      setProgress(ratio * 100)
      if (ratio <= 0) onDismiss()
    }
    const id = window.setInterval(tick, 100)
    return () => window.clearInterval(id)
  }, [mission.id, durationMs, onDismiss])

  const fare = computeDisplayFare(mission)
  const priceLabel = `${fare.value.toFixed(0)} €`

  const distFromMe = userCoords && mission.departure_lat != null && mission.departure_lng != null
    ? haversineKm(userCoords, { lat: mission.departure_lat, lng: mission.departure_lng })
    : null

  const typeLabel = mission.type === 'CPAM'
    ? `CPAM · ${mission.medical_motif === 'HDJ' ? 'HDJ' : mission.medical_motif === 'CONSULTATION' ? 'Consultation' : '—'}`
    : 'Standard'

  const durationLabel = mission.duration_min != null ? `${Math.round(mission.duration_min)} min` : '—'

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center px-4" role="dialog" aria-modal="true" aria-label="Nouvelle course">
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Ignorer"
        className="absolute inset-0 bg-ink/70 backdrop-blur-sm motion-safe:animate-[fade-in_0.2s_ease-out]"
      />
      <div className="relative w-full max-w-[420px] bg-paper dark:bg-night-surface rounded-3xl shadow-[0_30px_80px_rgba(0,0,0,0.4)] overflow-hidden motion-safe:animate-[slide-up_0.25s_cubic-bezier(0.22,0.61,0.36,1)]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-[11px] font-extrabold tracking-[0.06em] uppercase ${
            mission.type === 'CPAM' ? 'bg-blue-50 text-blue-700' : 'bg-warm-100 text-ink dark:bg-night-elevated dark:text-night-text'
          }`}>
            {typeLabel}
          </span>
          <button
            type="button" onClick={onDismiss} aria-label="Fermer"
            className="w-8 h-8 rounded-full hover:bg-warm-100 dark:hover:bg-night-elevated flex items-center justify-center text-ink dark:text-night-text"
          >
            <X className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>

        {/* Hero prix */}
        <div className="px-5 pb-3">
          <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-warm-500 dark:text-night-text-soft">Nouvelle annonce</p>
          <p className="text-[44px] font-extrabold tracking-[-0.025em] leading-none mt-1.5 text-ink dark:text-night-text" style={{ fontFeatureSettings: '"tnum"' }}>{priceLabel}</p>
        </div>

        {/* Adresses */}
        <div className="px-5 py-3 border-t border-warm-200 dark:border-night-border">
          <div className="flex items-start gap-3 py-1">
            <span className="mt-1.5 w-2.5 h-2.5 rounded-full bg-ink dark:bg-night-text shrink-0" />
            <div className="min-w-0">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-warm-400">Départ</p>
              <p className="text-[14px] font-semibold text-ink dark:text-night-text leading-snug truncate">{mission.departure}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 py-1 mt-1">
            <span className="mt-1.5 w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: '#F0B800' }} />
            <div className="min-w-0">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-warm-400">Arrivée</p>
              <p className="text-[14px] font-semibold text-ink dark:text-night-text leading-snug truncate">{mission.destination}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 divide-x divide-warm-200 dark:divide-night-border border-t border-warm-200 dark:border-night-border">
          <Stat icon={<Navigation className="w-3.5 h-3.5" strokeWidth={2} />} label="À toi" value={distFromMe != null ? `${distFromMe.toFixed(1).replace('.', ',')} km` : '—'} />
          <Stat icon={<MapPin className="w-3.5 h-3.5" strokeWidth={2} />} label="Course" value={mission.distance_km != null ? `${mission.distance_km.toFixed(1).replace('.', ',')} km` : '—'} />
          <Stat icon={<Clock className="w-3.5 h-3.5" strokeWidth={2} />} label="Durée" value={durationLabel} />
        </div>

        {/* CTAs */}
        <div className="px-5 py-4 grid grid-cols-[1fr_auto] gap-2 border-t border-warm-200 dark:border-night-border">
          <button
            type="button" onClick={onAccept}
            className="h-12 rounded-2xl bg-ink dark:bg-night-brand text-paper dark:text-night-bg font-extrabold text-[14px] shadow-[0_8px_20px_-4px_rgba(0,0,0,0.4)] active:scale-[0.98] transition-transform"
          >
            Accepter
          </button>
          <button
            type="button" onClick={onDetail}
            className="h-12 px-4 rounded-2xl bg-warm-100 dark:bg-night-elevated text-ink dark:text-night-text font-bold text-[13px]"
          >
            Détail
          </button>
        </div>

        {/* Barre de progression */}
        <div className="h-1 bg-warm-200 dark:bg-night-border">
          <div
            className="h-full bg-brand transition-[width] ease-linear"
            style={{ width: `${progress}%`, transitionDuration: '100ms' }}
          />
        </div>
      </div>
    </div>
  )
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="px-3 py-3 text-center">
      <div className="flex items-center justify-center gap-1 text-warm-500 dark:text-night-text-soft">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-[0.1em]">{label}</span>
      </div>
      <p className="mt-1 text-[14px] font-extrabold text-ink dark:text-night-text" style={{ fontFeatureSettings: '"tnum"' }}>{value}</p>
    </div>
  )
}
