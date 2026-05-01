'use client'
import type { Mission } from '@/lib/supabase/types'
import { deriveTrackerStep, type TrackerStep } from './adsHelpers'

interface Props {
  mission: Mission
  now: number
}

const STEPS: { key: TrackerStep; label: string }[] = [
  { key: 'accepted', label: 'Acceptée' },
  { key: 'enroute', label: 'En route' },
  { key: 'onboard', label: 'Patient à bord' },
  { key: 'done', label: 'Terminée' },
]

const ORDER: Record<TrackerStep, number> = {
  accepted: 0, enroute: 1, onboard: 2, done: 3,
}

export function AdTracker({ mission, now }: Props) {
  const current = deriveTrackerStep(mission, now)
  const currentIdx = ORDER[current]
  const fillPct = currentIdx === 0 ? 0 : (currentIdx / 3) * 100

  return (
    <div className="mt-2.5 p-2.5 rounded-xl bg-paper/70 backdrop-blur-sm">
      <div className="grid grid-cols-4 gap-1.5 items-start text-center">
        {STEPS.map((s) => {
          const idx = ORDER[s.key]
          const done = idx < currentIdx
          const isNow = idx === currentIdx
          const dotClass = done
            ? 'bg-success'
            : isNow
              ? 'bg-blue-500 motion-safe:animate-pulse'
              : 'bg-warm-200'
          const labelClass = done || isNow ? 'text-ink' : 'text-warm-500'
          return (
            <div key={s.key} className="flex flex-col items-center gap-1">
              <span
                className={`w-3 h-3 rounded-full ${dotClass} ring-2 ring-paper`}
                aria-hidden="true"
              />
              <span className={`text-[9.5px] font-bold leading-tight ${labelClass}`}>
                {s.label}
              </span>
            </div>
          )
        })}
      </div>
      <div className="mt-1.5 h-[2px] mx-3 bg-warm-200 rounded-full relative">
        <div
          className="absolute inset-y-0 left-0 bg-success rounded-full transition-all"
          style={{ width: `${fillPct}%` }}
        />
      </div>
    </div>
  )
}
