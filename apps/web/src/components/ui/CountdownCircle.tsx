'use client'

import { useEffect, useState } from 'react'

interface CountdownCircleProps {
  totalSeconds: number
  remainingSeconds: number
  size?: number
  strokeWidth?: number
}

export function CountdownCircle({
  totalSeconds,
  remainingSeconds,
  size = 52,
  strokeWidth = 3,
}: CountdownCircleProps) {
  const radius = (size - strokeWidth * 2) / 2
  const circumference = 2 * Math.PI * radius
  const progress = remainingSeconds / totalSeconds
  const dashOffset = circumference * (1 - progress)
  const isUrgent = remainingSeconds <= 10
  const strokeColor = isUrgent ? '#EF4444' : '#FFD23F'

  return (
    <div className="countdown-circle relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="countdown-circle-progress"
          stroke={strokeColor}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={`text-[11px] font-bold leading-tight ${isUrgent ? 'text-red-500' : 'text-secondary'}`}
        >
          {remainingSeconds}s
        </span>
      </div>
    </div>
  )
}

interface LiveCountdownProps {
  scheduledAt: string
  onExpire?: () => void
}

export function LiveCountdown({ scheduledAt, onExpire }: LiveCountdownProps) {
  const totalSeconds = 30
  const getRemaining = () => {
    const diff = new Date(scheduledAt).getTime() - Date.now()
    if (diff <= 0) return 0
    // Map to 0-30s window for display
    return Math.min(totalSeconds, Math.max(0, Math.round(diff / 1000)))
  }

  const [remaining, setRemaining] = useState(getRemaining)

  useEffect(() => {
    const id = setInterval(() => {
      const r = getRemaining()
      setRemaining(r)
      if (r === 0) onExpire?.()
    }, 1000)
    return () => clearInterval(id)
  }, [scheduledAt])

  return (
    <CountdownCircle
      totalSeconds={totalSeconds}
      remainingSeconds={remaining}
    />
  )
}
