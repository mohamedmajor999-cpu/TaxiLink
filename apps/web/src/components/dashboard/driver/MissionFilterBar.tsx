'use client'

import { MISSION_TYPES, type MissionTypeFilter } from '@/constants/missionTypes'

export function MissionFilterBar({
  filter,
  count,
  onChange,
}: {
  filter: MissionTypeFilter
  count: number
  onChange: (f: MissionTypeFilter) => void
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm font-semibold text-muted mr-1">Filtrer :</span>
      {MISSION_TYPES.map((f) => (
        <button
          key={f}
          onClick={() => onChange(f)}
          className={`h-8 px-3 rounded-lg text-xs font-bold transition-all ${
            filter === f ? 'bg-secondary text-white' : 'bg-white border border-line text-muted hover:text-secondary'
          }`}
        >
          {f === 'ALL' ? 'Toutes' : f}
        </button>
      ))}
      <div className="flex-1" />
      <span className="text-sm font-semibold text-muted">
        {count} mission{count > 1 ? 's' : ''}
      </span>
    </div>
  )
}
