'use client'
import type { MissionProgressStep } from '@/lib/missionProgress'

interface Props {
  progress: MissionProgressStep
}

const STEPS: { key: MissionProgressStep; label: string }[] = [
  { key: 'accepted', label: 'Acceptée' },
  { key: 'enroute',  label: 'En route' },
  { key: 'onboard',  label: 'À bord' },
  { key: 'dropped',  label: 'Déposé' },
]

const PROGRESS_TO_INDEX: Record<MissionProgressStep, number> = {
  available: 0, accepted: 0, enroute: 1, onboard: 2,
  dropped: 3, done: 3, no_show: 0, cancelled: 0,
}

export function StepBar({ progress }: Props) {
  const idx = PROGRESS_TO_INDEX[progress]

  return (
    <div>
      <div className="flex gap-[3px]">
        {STEPS.map((s, i) => {
          const isDone = i < idx || progress === 'done'
          const isCurrent = i === idx && progress !== 'done'
          const cls = isDone ? 'bg-ink' : isCurrent ? 'bg-brand' : 'bg-warm-200'
          return <span key={s.key} aria-hidden className={`flex-1 h-[3px] rounded-[2px] ${cls}`} />
        })}
      </div>
      <div className="grid grid-cols-4 gap-[3px] mt-2">
        {STEPS.map((s, i) => {
          const isDone = i < idx || progress === 'done'
          const isCurrent = i === idx && progress !== 'done'
          const color = isCurrent ? 'text-ink' : isDone ? 'text-warm-600' : 'text-warm-400'
          return (
            <span
              key={s.key}
              className={`text-[9.5px] font-bold uppercase tracking-[0.06em] leading-tight ${color}`}
            >
              {s.label}
            </span>
          )
        })}
      </div>
    </div>
  )
}
