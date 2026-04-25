'use client'
import type { ReactNode } from 'react'
import { Zap } from 'lucide-react'
import { HOME_TYPE_FILTERS, type HomeTypeFilter } from './useDriverHomeFilters'

interface Props {
  filter: HomeTypeFilter
  counts: Record<HomeTypeFilter, number>
  urgentOnly: boolean
  nearbyOnly: boolean
  hasUserCoords: boolean
  onFilterChange: (key: HomeTypeFilter) => void
  onUrgentToggle: () => void
  onNearbyToggle: () => void
  floating?: boolean
}

export function DriverHomeFilterChips({
  filter, counts, urgentOnly, nearbyOnly, hasUserCoords,
  onFilterChange, onUrgentToggle, onNearbyToggle, floating,
}: Props) {
  return (
    <div className={`flex gap-1.5 md:gap-2 overflow-x-auto hide-scrollbar ${floating ? 'px-4' : 'px-5 pb-3'}`}>
      {HOME_TYPE_FILTERS.map((f) => (
        <Chip
          key={f.key}
          active={filter === f.key}
          onClick={() => onFilterChange(f.key)}
          label={f.label}
          count={counts[f.key]}
          floating={floating}
        />
      ))}
      <Chip
        active={urgentOnly}
        onClick={onUrgentToggle}
        label="Urgent"
        icon={<Zap className="w-3 h-3" strokeWidth={2.2} />}
        floating={floating}
      />
      {hasUserCoords && (
        <Chip
          active={nearbyOnly}
          onClick={onNearbyToggle}
          label="< 5 km"
          floating={floating}
        />
      )}
    </div>
  )
}

interface ChipProps {
  active: boolean
  onClick: () => void
  label: string
  count?: number
  icon?: ReactNode
  floating?: boolean
}
function Chip({ active, onClick, label, count, icon, floating }: ChipProps) {
  const floatShadow = floating ? 'shadow-[0_4px_14px_rgba(0,0,0,0.1)]' : ''
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 inline-flex items-center gap-1 md:gap-1.5 h-7 md:h-9 px-2.5 md:px-3.5 rounded-full text-[11px] md:text-[12px] font-bold transition-colors ${floatShadow} ${
        active
          ? 'bg-ink text-paper border border-ink'
          : 'bg-paper text-ink border border-warm-200 hover:bg-warm-50'
      }`}
    >
      {icon}
      {label}
      {count != null && (
        <span className={`text-[11px] font-semibold ${active ? 'text-paper/60' : 'text-warm-500'}`}>{count}</span>
      )}
    </button>
  )
}
