'use client'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface WeekDay {
  date: Date
  dayShort: string
  count: number
  key: string
  disabled?: boolean
}

interface Props {
  days: WeekDay[]
  selected: Date
  onSelect: (d: Date) => void
  onPrev?: () => void
  onNext?: () => void
  canPrev?: boolean
  canNext?: boolean
}

export function WeekStrip({ days, selected, onSelect, onPrev, onNext, canPrev = false, canNext = false }: Props) {
  const selectedKey = selected.toDateString()
  return (
    <div className="flex items-center gap-1.5 mt-3">
      <NavBtn direction="prev" onClick={onPrev} disabled={!canPrev} />
      <div className="grid grid-cols-7 gap-1.5 flex-1">
        {days.map((d) => {
          const active = d.key === selectedKey
          const disabled = d.disabled === true
          return (
            <button
              key={d.key}
              type="button"
              onClick={() => !disabled && onSelect(d.date)}
              disabled={disabled}
              className={`flex flex-col items-center gap-1 py-2 rounded-xl transition-colors ${
                active
                  ? 'bg-ink text-paper'
                  : disabled
                  ? 'bg-paper text-warm-300 cursor-not-allowed opacity-50'
                  : 'bg-paper text-ink hover:bg-warm-50'
              }`}
            >
              <span className={`text-[10px] font-bold tracking-[0.06em] ${active ? 'text-paper/70' : 'text-warm-500'}`}>
                {d.dayShort}
              </span>
              <span className="text-[16px] font-extrabold tabular-nums leading-none">
                {d.date.getDate()}
              </span>
              <span className={`text-[10px] font-semibold tabular-nums ${active ? 'text-brand' : 'text-warm-400'}`}>
                {d.count > 0 ? d.count : '—'}
              </span>
            </button>
          )
        })}
      </div>
      <NavBtn direction="next" onClick={onNext} disabled={!canNext} />
    </div>
  )
}

function NavBtn({ direction, onClick, disabled }: { direction: 'prev' | 'next'; onClick?: () => void; disabled: boolean }) {
  const Icon = direction === 'prev' ? ChevronLeft : ChevronRight
  const label = direction === 'prev' ? 'Semaine précédente' : 'Semaine suivante'
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`shrink-0 w-8 h-12 rounded-xl flex items-center justify-center transition-colors ${
        disabled
          ? 'text-warm-300 cursor-not-allowed'
          : 'text-ink hover:bg-warm-50'
      }`}
    >
      <Icon className="w-5 h-5" strokeWidth={2.2} />
    </button>
  )
}
