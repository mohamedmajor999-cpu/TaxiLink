'use client'
import { X } from 'lucide-react'
import type { Mission } from '@/lib/supabase/types'
import { addressAsPoint } from '@/lib/splitFrenchAddress'
import { computeDisplayFare } from '@/lib/missionFare'
import { PostedTakenByBlock } from './PostedTakenByBlock'
import { PostedVisibilityStats } from './PostedVisibilityStats'
import { PostedManageActions } from './PostedManageActions'
import type { PostedDriverProfile } from './usePostedTab'

const TYPE_LABEL: Record<string, string> = {
  CPAM: 'Médical', PRIVE: 'Privé', TAXILINK: 'TaxiLink',
}

interface Props {
  mission: Mission
  driverProfile?: PostedDriverProfile
  deleting: boolean
  boosting: boolean
  onClose: () => void
  onEdit: () => void
  onBoost: () => void
  onDelete: () => void
}

export function PostedMissionModal({
  mission, driverProfile, deleting, boosting,
  onClose, onEdit, onBoost, onDelete,
}: Props) {
  const isWaiting = mission.status === 'AVAILABLE'
  const fare = computeDisplayFare(mission)
  const scheduledAt = new Date(mission.scheduled_at)
  const dateLabel = scheduledAt.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  const timeLabel = scheduledAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  const dep = addressAsPoint(mission.departure)
  const dst = addressAsPoint(mission.destination)
  const durationMin = mission.duration_min ?? 0
  const hoursWaiting = mission.created_at
    ? Math.floor((Date.now() - new Date(mission.created_at).getTime()) / 3_600_000)
    : 0
  const takerName = driverProfile?.full_name?.trim() || 'Chauffeur confirmé'

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/40 flex items-end justify-center"
      onClick={onClose}
    >
      <div
        className="bg-paper w-full max-w-lg rounded-t-2xl shadow-soft max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-ink rounded-t-2xl px-5 pt-5 pb-7 text-paper">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-paper/60">
                <span className={`w-2 h-2 rounded-full ${isWaiting ? 'bg-brand' : 'bg-blue-400'}`} />
                {isWaiting ? 'En attente' : 'Acceptée'}
              </span>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-paper/10 text-paper">
                {TYPE_LABEL[mission.type] ?? mission.type}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="w-8 h-8 rounded-xl bg-paper/10 flex items-center justify-center text-paper hover:bg-paper/20 transition-colors"
            >
              <X className="w-4 h-4" strokeWidth={1.8} />
            </button>
          </div>
          <p className="text-[12px] text-paper/50 font-semibold capitalize mb-5">
            {dateLabel} · {timeLabel}
          </p>

          <div className="flex items-end gap-4">
            <div className="flex-1 min-w-0 space-y-1.5">
              <Stop kind="out" name={dep.name} address={dep.address} />
              <div className="ml-[4px] h-3 w-px bg-paper/20" />
              <Stop kind="in" name={dst.name} address={dst.address} />
            </div>
            <div className="text-right shrink-0">
              {fare.isEstimated && (
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-paper/40 mb-0.5">
                  Estimé
                </p>
              )}
              <p className="text-[34px] font-black leading-none text-paper tabular-nums tracking-[-0.02em]">
                {fare.value}<span className="text-[22px]">€</span>
              </p>
              <p className="text-[11px] text-paper/40 mt-1.5 tabular-nums">
                {(mission.distance_km ?? 0).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} km
                {durationMin > 0 && <> · {durationMin} min</>}
              </p>
            </div>
          </div>
        </div>

        <div className="px-5 py-5">
          {isWaiting ? (
            <PostedVisibilityStats viewCount={mission.view_count ?? 0} hoursWaiting={hoursWaiting} />
          ) : (
            <PostedTakenByBlock
              name={takerName}
              phone={driverProfile?.phone ?? null}
              acceptedAt={mission.accepted_at}
            />
          )}

          <div>
            {mission.patient_name && <InfoRow label="Patient" value={mission.patient_name} />}
            {mission.phone && <InfoRow label="Téléphone client" value={mission.phone} />}
            {mission.notes && <InfoRow label="Notes" value={mission.notes} multiline />}
          </div>

          <PostedManageActions
            isWaiting={isWaiting}
            deleting={deleting}
            boosting={boosting}
            onEdit={onEdit}
            onBoost={onBoost}
            onDelete={onDelete}
          />
        </div>
      </div>
    </div>
  )
}

function Stop({ kind, name, address }: { kind: 'in' | 'out'; name: string; address?: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${kind === 'out' ? 'bg-paper' : 'bg-brand border-2 border-paper'}`} />
      <div className="min-w-0">
        <p className="text-[14px] font-bold text-paper leading-tight truncate">{name}</p>
        {address && <p className="text-[11px] text-paper/40 truncate mt-0.5">{address}</p>}
      </div>
    </div>
  )
}

function InfoRow({ label, value, multiline = false }: { label: string; value: string; multiline?: boolean }) {
  return (
    <div className="py-2.5 border-t border-warm-100 first:border-t-0">
      <p className="text-[10px] font-extrabold uppercase tracking-wider text-warm-400 mb-1">{label}</p>
      <p className={`text-[13px] text-ink ${multiline ? 'whitespace-pre-wrap' : ''}`}>{value}</p>
    </div>
  )
}
