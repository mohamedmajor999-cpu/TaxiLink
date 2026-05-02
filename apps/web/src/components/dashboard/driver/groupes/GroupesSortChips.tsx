'use client'
import type { SortMode } from '../useDriverGroupesScreen'

interface Props {
  value:    SortMode
  onChange: (mode: SortMode) => void
}

const OPTIONS: { value: SortMode; label: string }[] = [
  { value: 'activity', label: 'Plus actifs' },
  { value: 'recent',   label: 'Récents' },
  { value: 'name',     label: 'A → Z' },
]

export function GroupesSortChips({ value, onChange }: Props) {
  return (
    <div className="flex gap-1.5 mb-4 flex-wrap">
      {OPTIONS.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            aria-pressed={active}
            className={`text-[12px] font-semibold py-1.5 px-3 rounded-full border transition-colors ${
              active
                ? 'bg-ink text-paper border-ink'
                : 'bg-paper text-warm-600 border-warm-200 hover:bg-warm-50'
            }`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
