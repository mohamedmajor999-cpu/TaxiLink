'use client'
import { Pencil, AlertTriangle } from 'lucide-react'
import type { Mission } from '@/lib/supabase/types'
import { formatMissionPrice } from '@/lib/formatMissionPrice'
import { getMinutesUntil } from '@/lib/dateUtils'
import { formatDuration } from '@/lib/formatDuration'

interface Props {
  mission: Mission
  onTap: (id: string) => void
  onEdit: (mission: Mission) => void
}

export function TodayRideRow({ mission, onTap, onEdit }: Props) {
  const time = new Date(mission.scheduled_at).toLocaleTimeString('fr-FR', {
    hour: '2-digit', minute: '2-digit',
  })
  const fare = formatMissionPrice(mission)
  const isCpam = mission.transport_type === 'CPAM'
  const minutesUntil = getMinutesUntil(mission.scheduled_at)
  const isUrgent = minutesUntil > 0 && minutesUntil <= 15
  const delayLabel = minutesUntil <= 0 ? 'En retard' : formatDuration(minutesUntil)

  return (
    <div
      className={`relative flex gap-3 mb-2 rounded-2xl border p-2.5 transition-colors ${
        isUrgent
          ? 'border-danger bg-danger-soft'
          : 'border-warm-200 bg-paper hover:bg-warm-50'
      }`}
    >
      {isUrgent && (
        <span
          aria-hidden
          className="absolute -inset-px rounded-2xl border-2 border-danger pointer-events-none motion-safe:animate-pulse"
        />
      )}

      <button
        type="button"
        onClick={() => onTap(mission.id)}
        className="flex flex-1 gap-3 min-w-0 text-left"
      >
        <div className="w-[52px] shrink-0 self-stretch flex flex-col items-center justify-center border-r border-dashed border-warm-200 pr-2">
          <div className="text-[15px] font-black leading-none text-ink tabular-nums">{time}</div>
          <div className={`mt-1 text-[10px] font-bold inline-flex items-center gap-0.5 ${
            isUrgent ? 'text-danger' : 'text-warm-500'
          }`}>
            {isUrgent && <AlertTriangle className="w-2.5 h-2.5" strokeWidth={2.4} />}
            {delayLabel}
          </div>
        </div>

        <div className="flex-1 min-w-0 self-center">
          <p className="text-[13px] font-bold text-ink truncate">
            {mission.patient_name?.trim() || mission.departure}
          </p>
          <p className="text-[12px] text-warm-500 truncate mt-0.5">
            <span className="text-warm-300">→ </span>{mission.destination}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10.5px] font-semibold text-warm-500">
            {isCpam ? (
              <span className="text-[9.5px] font-extrabold uppercase tracking-[0.04em] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                CPAM
              </span>
            ) : (
              <span className="text-[9.5px] font-extrabold uppercase tracking-[0.04em] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">
                Privé
              </span>
            )}
            {mission.return_trip && <span>· A/R</span>}
            {mission.duration_min != null && <span>· {mission.duration_min} min</span>}
          </div>
        </div>
      </button>

      <div className="self-center shrink-0 text-right pr-1">
        <div className="text-[17px] font-black text-ink tabular-nums leading-none">{fare}</div>
      </div>

      <button
        type="button"
        onClick={() => onEdit(mission)}
        aria-label="Corriger les infos"
        className="self-center w-8 h-8 rounded-lg bg-warm-50 border border-warm-200 grid place-items-center text-warm-700 hover:bg-warm-100 transition-colors shrink-0"
      >
        <Pencil className="w-4 h-4" strokeWidth={2} />
      </button>
    </div>
  )
}
