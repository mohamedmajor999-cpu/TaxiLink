'use client'
import type { Group } from '@taxilink/core'
import type { HomeGroupSelection } from '../useDriverHome'
import { HOME_GROUP_PUBLIC } from '../useDriverHome'

interface Props {
  groups:   Group[]
  selected: HomeGroupSelection
  onSelect: (sel: HomeGroupSelection) => void
}

export function HomeGroupFilterBar({ groups, selected, onSelect }: Props) {
  return (
    <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0">
      <GroupPill active={selected === null} label="Tous" onClick={() => onSelect(null)} />
      {groups.map((g) => (
        <GroupPill
          key={g.id}
          active={selected === g.id}
          label={g.name}
          onClick={() => onSelect(g.id)}
        />
      ))}
      <GroupPill
        active={selected === HOME_GROUP_PUBLIC}
        label="Public"
        onClick={() => onSelect(HOME_GROUP_PUBLIC)}
      />
    </div>
  )
}

function GroupPill({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full text-[12px] font-semibold transition-colors ${
        active
          ? 'bg-ink text-paper'
          : 'bg-paper text-warm-600 border border-warm-200 hover:bg-warm-50'
      }`}
    >
      {active && <span className="w-1.5 h-1.5 rounded-full bg-brand" />}
      {label}
    </button>
  )
}
