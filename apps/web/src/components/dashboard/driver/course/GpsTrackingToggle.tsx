'use client'
import { Loader2, MapPin, MapPinOff, ShieldAlert } from 'lucide-react'
import type { GeofenceStatus } from '@/hooks/useCourseGeofence'

interface Props {
  enabled: boolean
  status: GeofenceStatus
  accuracyM: number | null
  onEnable: () => void
  onDisable: () => void
}

const STATUS_LABEL: Record<GeofenceStatus, string> = {
  idle: 'Suivi GPS désactivé',
  searching: 'Recherche du signal GPS…',
  'pickup-zone': '📍 Approche du patient',
  onboard: '✓ Patient à bord (auto)',
  'dropoff-zone': '📍 Approche de la destination',
  denied: 'Permission GPS refusée',
  unsupported: 'GPS non disponible sur cet appareil',
}

export function GpsTrackingToggle({ enabled, status, accuracyM, onEnable, onDisable }: Props) {
  const blocked = status === 'denied' || status === 'unsupported'
  const isPulsing = status === 'pickup-zone' || status === 'dropoff-zone'

  return (
    <section className="rounded-2xl border border-warm-200 bg-paper p-4 mb-3">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className={[
            'shrink-0 w-9 h-9 rounded-full flex items-center justify-center',
            blocked ? 'bg-danger-soft text-danger'
              : enabled && isPulsing ? 'bg-emerald-100 text-emerald-700 motion-safe:animate-pulse'
              : enabled ? 'bg-emerald-50 text-emerald-700'
              : 'bg-warm-100 text-warm-500',
          ].join(' ')}
        >
          {blocked ? <ShieldAlert className="w-4 h-4" strokeWidth={2.2} />
            : status === 'searching' ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.2} />
            : enabled ? <MapPin className="w-4 h-4" strokeWidth={2.2} />
            : <MapPinOff className="w-4 h-4" strokeWidth={2.2} />}
        </span>

        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold text-ink leading-tight">
            Suivi automatique GPS
          </p>
          <p className="text-[11.5px] text-warm-500 mt-0.5 truncate">
            {STATUS_LABEL[status]}
            {accuracyM != null && enabled && !blocked && ` · précision ±${Math.round(accuracyM)} m`}
          </p>
        </div>

        {!blocked && (
          <button
            type="button"
            onClick={enabled ? onDisable : onEnable}
            className={[
              'shrink-0 h-8 px-3 rounded-full text-[11.5px] font-extrabold uppercase tracking-wide transition-colors border',
              enabled
                ? 'bg-paper text-ink border-warm-300 hover:bg-warm-50'
                : 'bg-ink text-paper border-ink hover:brightness-110',
            ].join(' ')}
          >
            {enabled ? 'Stop' : 'Activer'}
          </button>
        )}
      </div>

      {!enabled && !blocked && (
        <p className="text-[11px] text-warm-500 mt-2 leading-snug">
          Quand vous l&apos;activez, le téléphone détecte automatiquement la prise en charge et la dépose,
          plus besoin de cliquer manuellement.
        </p>
      )}
    </section>
  )
}
