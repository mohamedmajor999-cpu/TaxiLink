'use client'

import { useIncomingMissionOffer } from '@/hooks/useIncomingMissionOffer'
import { Icon } from '@/components/ui/Icon'

function formatPrice(min: number | null, max: number | null, exact: number | null): string {
  if (exact != null) return `${exact.toFixed(2)} €`
  if (min != null && max != null) return `${min.toFixed(2)}–${max.toFixed(2)} €`
  return '—'
}

function formatHorizon(scheduledAt: string): string {
  const ms = new Date(scheduledAt).getTime() - Date.now()
  const min = Math.round(ms / 60_000)
  if (min <= 0) return 'Maintenant'
  if (min < 60) return `Dans ${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m === 0 ? `Dans ${h} h` : `Dans ${h} h ${m}`
}

/**
 * Modal "Course dispo" affichée quand le chauffeur reçoit une offre PENDING.
 * Câblée directement à useIncomingMissionOffer (pas de props). Auto-ferme
 * quand le countdown atteint 0 ou après accept/refuse.
 */
export function IncomingMissionOfferModal() {
  const { state, loading, error, accept, refuse } = useIncomingMissionOffer()
  if (!state) return null
  const { offer, mission, secondsLeft } = state

  const totalDuration = Math.round((new Date(offer.expires_at).getTime() - new Date(offer.sent_at).getTime()) / 1000)
  const progressPct = Math.max(0, Math.min(100, (secondsLeft / totalDuration) * 100))
  const distanceLabel = offer.distance_km_at_offer != null
    ? `${offer.distance_km_at_offer.toFixed(1)} km de vous`
    : null
  const isCpam = mission.type === 'CPAM'

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end md:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="incoming-offer-title"
    >
      <div className="absolute inset-0 bg-black/70" />
      <div className="relative bg-white w-full max-w-md rounded-t-3xl md:rounded-3xl shadow-xl overflow-hidden">

        {/* Bandeau countdown */}
        <div className="bg-secondary text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="bolt" size={20} className="text-primary" />
            <span className="font-bold text-sm uppercase tracking-wide">Course dispo</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black tabular-nums">{secondsLeft}</span>
            <span className="text-xs font-semibold opacity-70">s</span>
          </div>
        </div>
        {/* Barre de progression */}
        <div className="h-1 bg-white/10 relative">
          <div
            className="absolute inset-y-0 left-0 bg-primary transition-[width] duration-1000 ease-linear"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Détails course */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center h-6 px-2.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              isCpam ? 'bg-blue-100 text-blue-700' : 'bg-bgsoft text-secondary'
            }`}>
              {isCpam ? 'CPAM' : 'Privé'}
            </span>
            <span className="text-xs font-semibold text-muted">{formatHorizon(mission.scheduled_at)}</span>
            {distanceLabel && (
              <span className="text-xs font-semibold text-muted ml-auto">{distanceLabel}</span>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <Icon name="my_location" size={16} className="text-secondary mt-0.5 shrink-0" />
              <p className="text-sm font-semibold text-secondary">{mission.departure}</p>
            </div>
            <div className="flex items-start gap-2">
              <Icon name="place" size={16} className="text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm font-semibold text-secondary">{mission.destination}</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-line">
            <div>
              <p className="text-[10px] uppercase font-bold text-muted tracking-wider">Distance</p>
              <p className="text-sm font-bold text-secondary">
                {mission.distance_km != null ? `${mission.distance_km.toFixed(1)} km` : '—'}
                {mission.duration_min != null && ` · ${mission.duration_min} min`}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase font-bold text-muted tracking-wider">Tarif</p>
              <p className="text-lg font-black text-secondary">
                {formatPrice(mission.price_min_eur, mission.price_max_eur, mission.price_eur)}
              </p>
            </div>
          </div>

          {error && (
            <p className="flex items-center gap-1.5 text-xs text-red-500 font-semibold">
              <Icon name="error" size={14} />{error}
            </p>
          )}

          <div className="flex flex-col gap-2 pt-1">
            <button
              onClick={accept}
              disabled={loading}
              className="h-12 rounded-2xl bg-primary text-secondary font-black text-base flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading
                ? <><Icon name="sync" size={18} className="animate-spin" />Patientez…</>
                : <>JE PRENDS<Icon name="arrow_forward" size={18} /></>
              }
            </button>
            <button
              onClick={refuse}
              disabled={loading}
              className="h-10 rounded-xl text-sm font-semibold text-muted hover:text-red-500 transition-colors disabled:opacity-50"
            >
              Refuser
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
