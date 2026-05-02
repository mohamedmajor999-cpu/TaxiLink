'use client'
import { useRef, type TouchEvent } from 'react'
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

const SWIPE_THRESHOLD = 50

export function WeekStrip({ days, selected, onSelect, onPrev, onNext, canPrev = false, canNext = false }: Props) {
  const selectedKey = selected.toDateString()
  const startX = useRef<number | null>(null)
  const startY = useRef<number | null>(null)

  function handleTouchStart(e: TouchEvent<HTMLDivElement>) {
    startX.current = e.touches[0].clientX
    startY.current = e.touches[0].clientY
  }

  function handleTouchEnd(e: TouchEvent<HTMLDivElement>) {
    if (startX.current === null || startY.current === null) return
    const dx = e.changedTouches[0].clientX - startX.current
    const dy = e.changedTouches[0].clientY - startY.current
    startX.current = null
    startY.current = null
    if (Math.abs(dx) < SWIPE_THRESHOLD) return
    if (Math.abs(dy) > Math.abs(dx)) return
    if (dx < 0 && canNext) onNext?.()
    else if (dx > 0 && canPrev) onPrev?.()
  }

  return (
    <div
      className="flex items-center gap-1.5 mt-3 touch-pan-y select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
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
