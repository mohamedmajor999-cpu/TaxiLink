import { useEffect, useState } from 'react'

const TOTAL_SECONDS = 30

function getRemaining(scheduledAt: string): number {
  const diff = new Date(scheduledAt).getTime() - Date.now()
  if (diff <= 0) return 0
  return Math.min(TOTAL_SECONDS, Math.max(0, Math.round(diff / 1000)))
}

export function useLiveCountdown(scheduledAt: string, onExpire?: () => void) {
  const [remaining, setRemaining] = useState(() => getRemaining(scheduledAt))

  useEffect(() => {
    const id = setInterval(() => {
      const r = getRemaining(scheduledAt)
      setRemaining(r)
      if (r === 0) onExpire?.()
    }, 1000)
    return () => clearInterval(id)
  }, [scheduledAt])

  return { remaining, totalSeconds: TOTAL_SECONDS }
}
