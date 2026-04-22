'use client'
import { X, Phone, Navigation2 } from 'lucide-react'
import type { Mission } from '@/lib/supabase/types'
import { addressAsPoint } from '@/lib/splitFrenchAddress'
import { computeDisplayFare } from '@/lib/missionFare'

const TYPE_LABEL: Record<string, string> = {
  CPAM: 'Médical', PRIVE: 'Privé', TAXILINK: 'TaxiLink',
}

const STATUS_MAP: Record<string, { label: string; dot: string; pulse?: boolean }> = {
  ACCEPTED:    { label: 'Planifiée',  dot: 'bg-blue-400'  },
  IN_PROGRESS: { label: 'En cours',   dot: 'bg-green-400', pulse: true },
  DONE:        { label: 'Terminée',   dot: 'bg-warm-400'  },
  AVAILABLE:   { label: 'Disponible', dot: 'bg-amber-400' },
  CANCELLED:   { label: 'Annulée',    dot: 'bg-red-400'   },
}

interface Props {
  mission: Mission
  onClose: () => void
}

export function MissionDetailsModal({ mission, onClose }: Props) {
  const scheduledAt = new Date(mission.scheduled_at)
  const dateLabel = scheduledAt.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  const timeLabel = scheduledAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  const fare = computeDisplayFare(mission)
  const wazeHref = `https://waze.com/ul?q=${encodeURIComponent(mission.destination)}&navigate=yes`
  const status = STATUS_MAP[mission.status] ?? STATUS_MAP.ACCEPTED
  const durationMin = mission.duration_min ?? 0
  const dep = addressAsPoint(mission.departure)
  const dst = addressAsPoint(mission.destination)

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/40 flex items-end justify-center"
      onClick={onClose}
    >
      <div
        className="bg-paper w-full max-w-lg rounded-t-2xl shadow-soft max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Section sombre — informations principales */}
        <div className="bg-ink rounded-t-2xl px-5 pt-5 pb-7">
          {/* Ligne statut + type + fermer */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${status.dot} ${status.pulse ? 'animate-pulse' : ''}`} />
                <span className="text-[11px] font-bold text-paper/60 uppercase tracking-wider">{status.label}</span>
              </div>
              <span className="text-[12px] font-bold px-2.5 py-1 rounded-full bg-paper/10 text-paper">
                {TYPE_LABEL[mission.type] ?? mission.type}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="w-9 h-9 rounded-xl bg-paper/10 flex items-center justify-center text-paper hover:bg-paper/20 transition-colors"
            >
              <X className="w-4 h-4" strokeWidth={1.8} />
            </button>
          </div>

          {/* Date + heure */}
          <p className="text-[13px] text-paper/50 font-medium capitalize mb-5">{dateLabel} · {timeLabel}</p>

          {/* Patient (CPAM) */}
          {mission.patient_name && (
            <p className="text-[14px] font-semibold text-paper/80 mb-4">{mission.patient_name}</p>
          )}

          {/* Trajet + prix */}
          <div className="flex items-start gap-4">
            {/* Route */}
            <div className="flex-1 min-w-0 space-y-2.5">
              <div className="flex items-start gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-paper mt-1 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-paper leading-tight truncate">{dep.name}</p>
                  {dep.address && <p className="text-[12px] text-paper/40 truncate mt-0.5">{dep.address}</p>}
                </div>
              </div>
              <div className="ml-[4px] h-4 w-px bg-paper/20" />
              <div className="flex items-start gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-primary border-2 border-paper mt-1 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-paper leading-tight truncate">{dst.name}</p>
                  {dst.address && <p className="text-[12px] text-paper/40 truncate mt-0.5">{dst.address}</p>}
                </div>
              </div>
            </div>

            {/* Prix */}
            <div className="text-right shrink-0">
              {fare.isEstimated && (
                <p className="text-[10px] font-bold uppercase tracking-wide text-paper/40 mb-0.5">Estimé</p>
              )}
              {fare.value > 0 ? (
                <p className="text-[38px] font-black leading-none text-paper tabular-nums tracking-tight">
                  {fare.value}<span className="text-[26px]">€</span>
                </p>
              ) : (
                <p className="text-[38px] font-black leading-none text-paper/30">—</p>
              )}
              <p className="text-[12px] text-paper/40 mt-1.5 tabular-nums">
                {(mission.distance_km ?? 0).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} km
                {durationMin > 0 && <> · {durationMin} min</>}
              </p>
            </div>
          </div>
        </div>

        {/* Section claire — infos complémentaires + actions */}
        <div className="px-5 py-5 space-y-4">
          {mission.phone && <InfoRow label="Téléphone" value={mission.phone} />}
          {mission.notes && <InfoRow label="Notes" value={mission.notes} multiline />}

          <div className="flex gap-3 pt-1">
            <a
              href={wazeHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 h-14 rounded-2xl bg-ink text-paper text-[14px] font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              <Navigation2 className="w-4 h-4" strokeWidth={2} />
              Naviguer
            </a>
            {mission.phone && (
              <a
                href={`tel:${mission.phone}`}
                className="flex-1 h-14 rounded-2xl border-2 border-warm-200 text-ink text-[14px] font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              >
                <Phone className="w-4 h-4" strokeWidth={2} />
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
      <p className="text-[11px] font-bold uppercase tracking-wider text-warm-400 mb-1">{label}</p>
      <p className={`text-[14px] text-ink ${multiline ? 'whitespace-pre-wrap' : ''}`}>{value}</p>
    </div>
  )
}
