'use client'
import { X, Phone, Navigation2 } from 'lucide-react'
import { RouteTimeline } from '@/components/taxilink/RouteTimeline'
import { RideBadge } from '@/components/taxilink/RideBadge'
import type { Mission } from '@/lib/supabase/types'
import { addressAsPoint } from '@/lib/splitFrenchAddress'
import { computeDisplayFare } from '@/lib/missionFare'

interface Props {
  mission: Mission
  onClose: () => void
}

export function MissionDetailsModal({ mission, onClose }: Props) {
  const scheduledAt = new Date(mission.scheduled_at)
  const dateLabel = scheduledAt.toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
  const timeLabel = scheduledAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  const badge = mission.type === 'CPAM'
    ? { variant: 'medical' as const, label: 'Médical' }
    : mission.type === 'PRIVE'
      ? { variant: 'private' as const, label: 'Privé' }
      : { variant: 'fleet' as const, label: 'TaxiLink' }
  const wazeHref = `https://waze.com/ul?q=${encodeURIComponent(mission.destination)}&navigate=yes`
  const fare = computeDisplayFare(mission)

  return (
    <div className="fixed inset-0 z-50 bg-ink/40 flex items-end md:items-center justify-center p-0 md:p-4" onClick={onClose}>
      <div
        className="bg-paper w-full max-w-lg rounded-t-2xl md:rounded-2xl shadow-soft max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="sticky top-0 bg-paper z-10 px-5 py-4 border-b border-warm-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <RideBadge variant={badge.variant}>{badge.label}</RideBadge>
            <span className="text-[13px] font-semibold text-ink truncate capitalize">
              {dateLabel} · {timeLabel}
            </span>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer" className="w-9 h-9 rounded-lg bg-warm-100 flex items-center justify-center text-ink hover:bg-warm-200 transition-colors shrink-0">
            <X className="w-4 h-4" strokeWidth={1.8} />
          </button>
        </header>

        <div className="px-5 py-5 space-y-5">
          <div className="grid grid-cols-[1fr_auto] gap-4 items-end">
            <RouteTimeline from={addressAsPoint(mission.departure)} to={addressAsPoint(mission.destination)} compact />
            <div className="text-right">
              {fare.isEstimated && (
                <div className="text-[10px] font-bold uppercase tracking-wider text-warm-500 mb-0.5">
                  Prix estimé
                </div>
              )}
              <div className="text-[32px] font-bold leading-none text-ink tabular-nums tracking-tight">
                {fare.value}<span className="text-[24px]">€</span>
              </div>
              <div className="text-[11px] text-warm-500 mt-1 tabular-nums">
                {(mission.distance_km ?? 0).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} km
              </div>
            </div>
          </div>

          {mission.patient_name && (
            <InfoRow label="Patient" value={mission.patient_name} />
          )}
          {mission.phone && (
            <InfoRow label="Téléphone" value={mission.phone} />
          )}
          {mission.notes && (
            <InfoRow label="Notes" value={mission.notes} multiline />
          )}

          <div className="flex gap-2 pt-2">
            <a
              href={wazeHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-1.5 h-11 px-4 rounded-lg bg-ink text-paper text-[13px] font-semibold hover:bg-warm-800 transition-colors"
            >
              <Navigation2 className="w-4 h-4" strokeWidth={1.8} />
              Naviguer
            </a>
            {mission.phone && (
              <a
                href={`tel:${mission.phone}`}
                className="flex-1 inline-flex items-center justify-center gap-1.5 h-11 px-4 rounded-lg border border-warm-300 text-ink text-[13px] font-semibold hover:bg-warm-50 transition-colors"
              >
                <Phone className="w-4 h-4" strokeWidth={1.8} />
                Appeler
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value, multiline = false }: { label: string; value: string; multiline?: boolean }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wider text-warm-500 mb-1">{label}</p>
      <p className={`text-[14px] text-ink ${multiline ? 'whitespace-pre-wrap' : ''}`}>{value}</p>
    </div>
  )
}
