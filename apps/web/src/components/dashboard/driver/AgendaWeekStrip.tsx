'use client'

import { Icon } from '@/components/ui/Icon'
import { isSameDay } from '@/lib/utils'
import type { Mission } from '@/lib/supabase/types'

const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

type AgendaWeekStripProps = {
  week: Date[]
  selected: Date
  today: Date
  title: string
  hasMissions: (d: Date) => boolean
  onSelect: (d: Date) => void
  onPrev: () => void
  onNext: () => void
}

export function AgendaWeekStrip({
  week, selected, today, title, hasMissions, onSelect, onPrev, onNext,
}: AgendaWeekStripProps) {
  return (
    <div className="bg-white rounded-2xl shadow-soft p-4">
      <div className="flex items-center justify-between mb-3">
        <button onClick={onPrev} aria-label="Semaine précédente"
          className="w-9 h-9 rounded-xl bg-bgsoft flex items-center justify-center hover:bg-line transition-colors">
          <Icon name="chevron_left" size={20} />
        </button>
        <span className="text-sm font-bold text-secondary capitalize">{title}</span>
        <button onClick={onNext} aria-label="Semaine suivante"
          className="w-9 h-9 rounded-xl bg-bgsoft flex items-center justify-center hover:bg-line transition-colors">
          <Icon name="chevron_right" size={20} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {week.map((d, i) => {
          const sel = isSameDay(d, selected)
          const tod = isSameDay(d, today)
          return (
            <button key={i} onClick={() => onSelect(d)}
              className={`flex flex-col items-center py-2 rounded-xl transition-all ${
                sel ? 'bg-secondary text-white' : tod ? 'bg-yellow-50 text-secondary' : 'hover:bg-bgsoft text-muted'
              }`}>
              <span className="text-[10px] font-semibold uppercase">{DAY_LABELS[i]}</span>
              <span className="text-sm font-bold">{d.getDate()}</span>
              {hasMissions(d) && <div className="w-1 h-1 rounded-full mt-0.5 bg-primary" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
