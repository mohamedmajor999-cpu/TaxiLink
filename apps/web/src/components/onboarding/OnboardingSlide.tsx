'use client'

import { OnboardingDots } from './OnboardingDots'

interface Props {
  variant:  'light' | 'dark'
  title:    React.ReactNode
  lead:     string
  illo:     React.ReactNode
  stepIdx:  number
  total:    number
  onNext:   () => void
  onSkip:   () => void
  nextLabel?: string
}

export function OnboardingSlide({
  variant, title, lead, illo, stepIdx, total, onNext, onSkip, nextLabel = 'Continuer',
}: Props) {
  const isDark = variant === 'dark'

  return (
    <div
      className={`min-h-[100dvh] w-full flex flex-col pwa-safe-top pwa-safe-bottom animate-fade-in ${
        isDark ? 'bg-ink text-white' : 'bg-white text-ink'
      }`}
    >
      <div className="flex items-center justify-end px-5 pt-4 h-14">
        <button
          type="button"
          onClick={onSkip}
          className={`text-[15px] font-semibold ${isDark ? 'text-white/70 hover:text-white' : 'text-warm-500 hover:text-ink'}`}
        >
          Passer
        </button>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex items-center justify-center px-6 py-6 min-h-[240px]">
          {illo}
        </div>

        <div className="px-6 pb-2">
          <h1 className={`text-[30px] md:text-[34px] font-extrabold tracking-[-0.03em] leading-[1.1] ${isDark ? 'text-white' : 'text-ink'}`}>
            {title}
          </h1>
          <p className={`mt-3 text-[15px] md:text-[16px] leading-[1.5] ${isDark ? 'text-white/60' : 'text-warm-500'}`}>
            {lead}
          </p>
        </div>

        <div className="mt-6 mb-6">
          <OnboardingDots total={total} active={stepIdx} variant={variant} />
        </div>

        <div className="px-5 pb-6">
          <button
            type="button"
            onClick={onNext}
            className="w-full h-14 rounded-full bg-brand text-ink font-bold text-[16px] tracking-[-0.01em] shadow-[0_10px_30px_-8px_rgba(255,210,26,0.55)] active:scale-[0.98] transition-transform"
          >
            {nextLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
