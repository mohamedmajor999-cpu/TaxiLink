import { Check } from 'lucide-react'
import type { MissionProgressStep } from '@/lib/missionProgress'

const STEPS: { key: MissionProgressStep; label: string }[] = [
  { key: 'accepted', label: 'Acceptée' },
  { key: 'enroute', label: 'En route' },
  { key: 'onboard', label: 'À bord' },
  { key: 'dropped', label: 'Déposé' },
]

const ORDER: Record<MissionProgressStep, number> = {
  available: -1,
  accepted: 0,
  enroute: 1,
  onboard: 2,
  dropped: 3,
  done: 4,
  no_show: 4,
  cancelled: 4,
}

interface Props {
  step: MissionProgressStep
}

export function CourseProgressStepper({ step }: Props) {
  const currentIndex = ORDER[step]

  return (
    <ol className="flex items-center gap-1.5" aria-label="Progression de la course">
      {STEPS.map((s, i) => {
        const isDone = currentIndex > i
        const isCurrent = currentIndex === i
        return (
          <li key={s.key} className="flex-1 flex flex-col items-center">
            <div
              className={`relative flex items-center w-full ${i === 0 ? 'justify-end' : i === STEPS.length - 1 ? 'justify-start' : 'justify-center'}`}
            >
              {i > 0 && (
                <span
                  aria-hidden="true"
                  className={`absolute left-0 right-1/2 h-0.5 ${isDone || isCurrent ? 'bg-ink' : 'bg-warm-200'}`}
                />
              )}
              {i < STEPS.length - 1 && (
                <span
                  aria-hidden="true"
                  className={`absolute left-1/2 right-0 h-0.5 ${isDone ? 'bg-ink' : 'bg-warm-200'}`}
                />
              )}
              <span
                className={`relative w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors ${
                  isDone
                    ? 'bg-ink text-paper'
                    : isCurrent
                      ? 'bg-brand text-ink ring-4 ring-brand/30'
                      : 'bg-paper border border-warm-300 text-warm-500'
                }`}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {isDone ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : i + 1}
              </span>
            </div>
            <span
              className={`mt-1.5 text-[10px] font-bold uppercase tracking-[0.04em] ${
                isCurrent ? 'text-ink' : isDone ? 'text-warm-500' : 'text-warm-400'
              }`}
            >
              {s.label}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
