'use client'
import { FieldCard } from './MissionFormPrimitives'

interface Props {
  date: string
  setDate: (v: string) => void
  time: string
  setTime: (v: string) => void
}

export function DateTimeFields({ date, setDate, time, setTime }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 mb-3">
      <FieldCard label="Date" filled={/^\d{4}-\d{2}-\d{2}$/.test(date.trim())} compact>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full h-10 px-3 rounded-xl border border-warm-200 focus:border-ink focus:outline-none text-[14px] font-semibold text-ink tabular-nums tracking-tight transition-colors"
        />
      </FieldCard>
      <FieldCard label="Heure" filled={/^\d{1,2}:\d{2}$/.test(time.trim())} compact>
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="w-full h-10 px-3 rounded-xl border border-warm-200 focus:border-ink focus:outline-none text-[18px] font-bold text-ink tabular-nums tracking-tight transition-colors"
        />
      </FieldCard>
    </div>
  )
}
