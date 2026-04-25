'use client'

interface WeekDay {
  date: Date
  dayShort: string
  count: number
  key: string
}

interface Props {
  days: WeekDay[]
  selected: Date
  onSelect: (d: Date) => void
}

export function WeekStrip({ days, selected, onSelect }: Props) {
  const selectedKey = selected.toDateString()
  return (
    <div className="grid grid-cols-7 gap-1.5 mt-3">
      {days.map((d) => {
        const active = d.key === selectedKey
        return (
          <button
            key={d.key}
            type="button"
            onClick={() => onSelect(d.date)}
            className={`flex flex-col items-center gap-1 py-2 rounded-xl transition-colors ${
              active ? 'bg-ink text-paper' : 'bg-paper text-ink hover:bg-warm-50'
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
  )
}
