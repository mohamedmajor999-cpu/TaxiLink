'use client'

import { Icon } from '@/components/ui/Icon'
import { TYPE_COLORS } from '@/constants/missionTypes'
import { getMinutesUntil } from '@/lib/dateUtils'
import type { Mission } from '@/lib/supabase/types'

type AvailableMissionGridProps = {
  missions: Mission[]
  accepting: string | null
  currentMission: Mission | null
  onAccept: (id: string) => void
}

export function AvailableMissionGrid({
  missions,
  accepting,
  currentMission,
  onAccept,
}: AvailableMissionGridProps) {
  if (missions.length === 0) {
    return (
      <div className="text-center py-20">
        <Icon name="explore_off" size={48} className="text-line mx-auto mb-3 block" />
        <p className="font-semibold text-secondary">Aucune mission disponible</p>
        <p className="text-sm text-muted mt-1">Revenez dans quelques instants</p>
      </div>
    )
  }

  return (
    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
      {missions.map((m) => {
        const min = getMinutesUntil(m.scheduled_at)
        const urgent = min <= 10
        return (
          <div key={m.id} className="mission-card bg-white rounded-2xl shadow-soft border border-line overflow-hidden">
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide ${TYPE_COLORS[m.type]}`}>
                  {m.type}
                </span>
                <div className={`flex items-center gap-1 text-xs font-bold ${urgent ? 'text-red-500' : 'text-muted'}`}>
                  <Icon name="schedule" size={13} />
                  {min === 0 ? 'Maintenant' : `Dans ${min} min`}
                </div>
              </div>

              {m.patient_name && (
                <p className="text-sm font-semibold text-secondary mb-3 flex items-center gap-1.5">
                  <Icon name="person" size={14} className="text-muted" />{m.patient_name}
                </p>
              )}

              <div className="flex items-start gap-3 mb-4">
                <div className="flex flex-col items-center gap-1 pt-1 flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-secondary" />
                  <div className="w-0.5 h-5 bg-line" />
                  <div className="w-2 h-2 rounded-full bg-primary border-2 border-secondary" />
                </div>
                <div className="space-y-1.5 min-w-0">
                  <p className="text-xs text-muted font-semibold truncate">{m.departure}</p>
                  <p className="text-xs text-secondary font-semibold truncate">{m.destination}</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xl font-black text-secondary">{m.price_eur?.toFixed(2)}€</p>
                  <p className="text-xs text-muted">{m.distance_km} km · {m.duration_min} min</p>
                </div>
                <div className="flex items-center gap-2">
                  {m.phone && (
                    <a
                      href={`tel:${m.phone}`}
                      className="w-9 h-9 rounded-xl bg-bgsoft border border-line flex items-center justify-center hover:bg-primary/20 transition-colors"
                      aria-label="Appeler"
                    >
                      <Icon name="call" size={16} />
                    </a>
                  )}
                  <button
                    onClick={() => onAccept(m.id)}
                    disabled={accepting === m.id || !!currentMission}
                    aria-label="Accepter"
                    className="h-9 px-4 rounded-xl bg-primary font-bold text-xs text-secondary flex items-center gap-1.5 hover:bg-yellow-400 transition-colors btn-ripple disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {accepting === m.id
                      ? <><Icon name="sync" size={14} className="animate-spin" />...</>
                      : <><Icon name="check" size={14} />Accepter</>}
                  </button>
                </div>
              </div>
            </div>
            {urgent && (
              <div className="bg-red-50 border-t border-red-100 px-5 py-2">
                <p className="text-xs text-red-600 font-semibold flex items-center gap-1.5">
                  <Icon name="warning" size={13} />Départ imminent — acceptez vite !
                </p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
