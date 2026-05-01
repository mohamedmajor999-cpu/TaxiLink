'use client'
import { Pencil } from 'lucide-react'
import type { Mission } from '@/lib/supabase/types'
import { formatMissionPrice } from '@/lib/formatMissionPrice'

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

  return (
    <div className="flex gap-3 py-3.5 border-b border-warm-100 last:border-0">
      <button
        type="button"
        onClick={() => onTap(mission.id)}
        className="flex flex-1 gap-3 min-w-0 text-left"
      >
        <div className="w-[52px] shrink-0 pt-0.5">
          <div className="text-[15px] font-extrabold leading-none text-ink tabular-nums">{time}</div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-semibold text-ink truncate">
            {mission.patient_name || mission.departure}
          </p>
          <p className="text-[13px] text-warm-500 truncate mt-0.5">→ {mission.destination}</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {isCpam ? (
              <span className="text-[10.5px] font-bold tracking-wide bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                CPAM
              </span>
            ) : (
              <span className="text-[10.5px] font-bold tracking-wide bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                Privé
              </span>
            )}
            {mission.return_trip && (
              <span className="text-[10.5px] font-bold tracking-wide bg-warm-100 text-warm-700 px-2 py-0.5 rounded-full">
                Retour
              </span>
            )}
          </div>
        </div>
      </button>
      <div className="text-right shrink-0 pt-0.5">
        <div className="text-[15px] font-extrabold text-ink tabular-nums">{fare}</div>
      </div>
      <button
        type="button"
        onClick={() => onEdit(mission)}
        aria-label="Corriger les infos"
        className="self-center w-8 h-8 rounded-lg bg-warm-50 border border-warm-100 grid place-items-center text-warm-700 hover:bg-warm-100 transition-colors shrink-0"
      >
        <Pencil className="w-4 h-4" strokeWidth={2} />
      </button>
    </div>
  )
}
