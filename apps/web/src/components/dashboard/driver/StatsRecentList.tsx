'use client'

import { TYPE_COLORS } from '@/constants/missionTypes'
import { formatDateShort } from '@/lib/utils'
import type { Mission } from '@/lib/supabase/types'

export function StatsRecentList({ missions }: { missions: Mission[] }) {
  if (missions.length === 0) return null
  return (
    <div className="bg-white rounded-2xl shadow-soft p-6">
      <h3 className="font-bold text-secondary mb-4">Dernières courses</h3>
      <div className="space-y-3">
        {missions.slice(0, 8).map((m) => (
          <div key={m.id} className="flex items-center justify-between py-3 border-b border-line last:border-0">
            <div className="flex items-center gap-3">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${TYPE_COLORS[m.type]}`}>{m.type}</span>
              <div>
                <p className="text-sm font-semibold text-secondary truncate max-w-xs">{m.destination}</p>
                <p className="text-xs text-muted">{formatDateShort(m.scheduled_at)}</p>
              </div>
            </div>
            <span className="font-black text-secondary">{m.price_eur?.toFixed(2)}€</span>
          </div>
        ))}
      </div>
    </div>
  )
}
