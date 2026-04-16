import { MISSION_STATUS_LABELS, MISSION_STATUS_COLORS } from '@/constants/missionTypes'
import { formatDateTime } from '@/lib/dateUtils'
import { Icon } from '@/components/ui/Icon'
import type { Mission } from '@/lib/supabase/types'

interface Props {
  missions: Mission[]
  onReserve: () => void
}

export function MissionList({ missions, onReserve }: Props) {
  return (
    <div>
      <h2 className="text-2xl font-black text-secondary mb-1">Mes courses</h2>
      <p className="text-muted mb-6">
        {missions.length} course{missions.length > 1 ? 's' : ''} au total
      </p>

      {missions.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl shadow-soft">
          <Icon name="local_taxi" size={48} className="text-line mx-auto mb-3 block" />
          <p className="font-semibold text-secondary">Aucune course pour l&apos;instant</p>
          <button
            onClick={onReserve}
            className="mt-4 h-10 px-6 rounded-xl bg-primary text-secondary font-bold text-sm inline-flex items-center gap-2 hover:bg-yellow-400 transition-colors"
          >
            Réserver mon premier taxi
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {missions.map((m) => {
            const s = MISSION_STATUS_LABELS[m.status] ?? m.status
            const color = MISSION_STATUS_COLORS[m.status] ?? 'bg-gray-100 text-gray-700'
            return (
              <div key={m.id} className="bg-white rounded-2xl shadow-soft border border-line p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${color}`}>{s}</span>
                  <span className="text-xs text-muted">{formatDateTime(m.scheduled_at)}</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center gap-1 pt-1">
                    <div className="w-2 h-2 rounded-full bg-secondary" />
                    <div className="w-0.5 h-5 bg-line" />
                    <div className="w-2 h-2 rounded-full bg-primary border-2 border-secondary" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted font-semibold">{m.departure}</p>
                    <p className="text-sm text-secondary font-semibold">{m.destination}</p>
                  </div>
                </div>
                {m.notes && <p className="text-xs text-muted mt-3 italic">&quot;{m.notes}&quot;</p>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
