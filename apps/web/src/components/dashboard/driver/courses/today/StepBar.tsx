'use client'
import type { HeroStep } from './useNextCourseHero'

interface Props {
  step: HeroStep
}

export function StepBar({ step }: Props) {
  const isPickup = step === 'toPickup'
  return (
    <div>
      <div className="flex gap-1.5">
        <span
          className={`flex-1 h-1 rounded-full ${
            isPickup ? 'bg-brand shadow-[0_0_0_3px_rgba(255,210,63,0.25)]' : 'bg-brand'
          }`}
        />
        <span
          className={`flex-1 h-1 rounded-full ${
            isPickup ? 'bg-paper/15' : 'bg-brand shadow-[0_0_0_3px_rgba(255,210,63,0.25)]'
          }`}
        />
      </div>
      <div className="flex justify-between text-[11px] mt-1.5 text-paper/70">
        <span className={isPickup ? 'text-brand font-bold' : ''}>1. En route vers le patient</span>
        <span className={!isPickup ? 'text-brand font-bold' : ''}>2. Vers destination</span>
      </div>
    </div>
  )
}
