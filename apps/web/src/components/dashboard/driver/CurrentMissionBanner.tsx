'use client'

import { Icon } from '@/components/ui/Icon'
import { TYPE_COLORS } from '@/constants/missionTypes'
import { formatMissionPrice } from '@/lib/formatMissionPrice'
import type { Mission } from '@/lib/supabase/types'

export function CurrentMissionBanner({
  mission,
  onComplete,
}: {
  mission: Mission
  onComplete: (id: string) => void
}) {
  return (
    <div className="bg-secondary rounded-2xl p-6 border-2 border-primary">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-green-400 status-pulse" />
          <span className="font-bold text-white text-sm uppercase tracking-wide">Mission en cours</span>
        </div>
        <span className={`text-xs font-bold px-3 py-1 rounded-full ${TYPE_COLORS[mission.type]}`}>
          {mission.type}
        </span>
      </div>

      {mission.patient_name && (
        <p className="text-white font-semibold mb-3">{mission.patient_name}</p>
      )}

      <div className="flex items-start gap-3 mb-4">
        <div className="flex flex-col items-center gap-1 pt-1">
          <div className="w-2.5 h-2.5 rounded-full bg-white" />
          <div className="w-0.5 h-8 bg-white/30" />
          <div className="w-2.5 h-2.5 rounded-full bg-primary border-2 border-white" />
        </div>
        <div className="space-y-3">
          <p className="text-white/70 text-sm">{mission.departure}</p>
          <p className="text-white text-sm font-semibold">{mission.destination}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-white font-black text-xl">{formatMissionPrice(mission, { decimals: true })}</span>
        <span className="text-white/50 text-sm">{mission.distance_km} km</span>
        <div className="flex-1" />
        {mission.phone && (
          <a
            href={`tel:${mission.phone}`}
            className="h-10 px-4 rounded-xl bg-white/20 text-white text-sm font-semibold flex items-center gap-2 hover:bg-white/30 transition-colors"
          >
            <Icon name="call" size={16} />Appeler
          </a>
        )}
        <button
          onClick={() => onComplete(mission.id)}
          className="h-10 px-4 rounded-xl bg-primary text-secondary text-sm font-bold flex items-center gap-2 hover:bg-yellow-400 transition-colors btn-ripple"
        >
          <Icon name="check_circle" size={16} />Terminer
        </button>
      </div>
    </div>
  )
}
