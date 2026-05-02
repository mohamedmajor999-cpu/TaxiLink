'use client'
import { Check } from 'lucide-react'
import type { MissionProgressStep } from '@/lib/missionProgress'

interface Props {
  progress: MissionProgressStep
}

const STEPS: { key: MissionProgressStep; label: string }[] = [
  { key: 'accepted', label: 'Acceptée' },
  { key: 'enroute', label: 'En route' },
  { key: 'onboard', label: 'À bord' },
  { key: 'dropped', label: 'Déposé' },
]

const PROGRESS_TO_INDEX: Record<MissionProgressStep, number> = {
  available: 0,
  accepted: 0,
  enroute: 1,
  onboard: 2,
  dropped: 3,
  done: 3,
  no_show: 0,
  cancelled: 0,
}

export function StepBar({ progress }: Props) {
  const currentIdx = PROGRESS_TO_INDEX[progress]

  return (
    <div className="grid grid-cols-4">
      {STEPS.map((step, i) => {
        const isDone = i < currentIdx || progress === 'done'
        const isCurrent = i === currentIdx && progress !== 'done'
        const reached = isDone || isCurrent

        return (
          <div key={step.key} className="relative pt-5 text-center">
            {i > 0 && (
              <span
                aria-hidden
                className={`absolute top-[7px] left-[-50%] right-[50%] h-[2px] ${
                  reached ? 'bg-brand' : 'bg-paper/15'
                }`}
              />
            )}
            <span
              aria-hidden
              className={`absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full grid place-items-center ${
                reached ? 'bg-brand' : 'bg-paper/15'
              } ${isCurrent ? 'shadow-[0_0_0_4px_rgba(255,210,63,0.25)] motion-safe:animate-pulse' : ''}`}
            >
              {isDone && <Check className="w-2.5 h-2.5 text-ink" strokeWidth={3} />}
            </span>
            <span
              className={`block text-[9.5px] font-bold uppercase tracking-[0.04em] leading-tight ${
                isCurrent ? 'text-paper' : 'text-paper/55'
              }`}
            >
              {step.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
