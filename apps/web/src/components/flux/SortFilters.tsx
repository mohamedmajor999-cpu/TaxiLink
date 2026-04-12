'use client'

import { useMissionStore } from '@/store/missionStore'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/utils'

type SortField = 'distance' | 'price' | 'startsIn'

const filters: { field: SortField; icon: string; label: string }[] = [
  { field: 'distance', icon: 'route', label: 'Distance' },
  { field: 'price', icon: 'euro', label: 'Prix' },
  { field: 'startsIn', icon: 'schedule', label: 'Début' },
]

export function SortFilters() {
  const { sortField, sortDir, toggleSort } = useMissionStore()

  const getSortArrow = (field: SortField) => {
    if (sortField !== field || sortDir === 'none') return ''
    return sortDir === 'asc' ? ' ↑' : ' ↓'
  }

  return (
    <div className="flex items-center gap-2">
      <button
        aria-label="Rafraîchir les missions"
        className="h-10 w-10 flex-shrink-0 rounded-xl bg-primary flex items-center justify-center transition-all active:scale-95"
      >
        <Icon name="refresh" size={18} className="text-secondary" />
      </button>

      {filters.map(({ field, icon, label }) => {
        const isActive = sortField === field && sortDir !== 'none'
        return (
          <button
            key={field}
            onClick={() => toggleSort(field)}
            aria-label={`Trier par ${label}`}
            className={cn(
              'flex-1 h-10 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1.5',
              isActive
                ? 'bg-secondary text-white border-secondary'
                : 'bg-white border-line text-secondary hover:border-gray-300'
            )}
          >
            <Icon name={icon} size={16} />
            <span>
              {label}
              {getSortArrow(field)}
            </span>
          </button>
        )
      })}
    </div>
  )
}
