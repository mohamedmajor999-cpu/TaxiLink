'use client'
import { useEffect, useState } from 'react'
import { Calendar, Clock, RefreshCw } from 'lucide-react'
import { formatScheduledDate, formatScheduledTime, formatCountdown } from './scheduleDisplay'

interface Props {
  scheduledAt: string
  returnTime?: string | null
}

// Rafraîchit le décompte toutes les 30 s pour rester exact sans surcharger.
function useMinuteTick(): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])
  return now
}

export function CourseScheduleBlock({ scheduledAt, returnTime }: Props) {
  const now = useMinuteTick()
  const dateLabel = formatScheduledDate(scheduledAt, now)
  const timeLabel = formatScheduledTime(scheduledAt)
  const countdown = formatCountdown(scheduledAt, now)
  const isPast = new Date(scheduledAt).getTime() < now.getTime() - 60_000

  return (
    <div className="rounded-2xl border border-warm-200 bg-paper p-4 mb-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-ink">
            <Calendar className="w-4 h-4 text-warm-500" strokeWidth={2} />
            <span className="text-[14px] font-semibold">{dateLabel}</span>
          </div>
          <div className="flex items-center gap-2 text-ink">
            <Clock className="w-4 h-4 text-warm-500" strokeWidth={2} />
            <span className="text-[14px] font-semibold tabular-nums">{timeLabel}</span>
          </div>
        </div>
        <span className={`text-[12px] font-semibold px-2.5 py-1 rounded-full ${isPast ? 'bg-danger-soft text-danger' : 'bg-brand-soft text-ink'}`}>
          {countdown}
        </span>
      </div>
      {returnTime && (
        <div className="mt-3 pt-3 border-t border-warm-200 flex items-center gap-2 text-warm-600">
          <RefreshCw className="w-4 h-4" strokeWidth={2} />
          <span className="text-[13px]">
            Aller-retour · retour prévu <span className="font-semibold text-ink tabular-nums">{returnTime}</span>
          </span>
        </div>
      )}
    </div>
  )
}
