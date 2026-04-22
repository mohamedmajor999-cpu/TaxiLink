'use client'
import { useEffect, useState } from 'react'
import { formatScheduledDate, formatScheduledTime, formatCountdown } from './scheduleDisplay'

export function useCourseTopStats(scheduledAt: string) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])

  const date = formatScheduledDate(scheduledAt, now)
  const time = formatScheduledTime(scheduledAt)
  const countdown = formatCountdown(scheduledAt, now)
  const isPast = new Date(scheduledAt).getTime() < now.getTime() - 60_000

  return { date, time, countdown, isPast }
}
