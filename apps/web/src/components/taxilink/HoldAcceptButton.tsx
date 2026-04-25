'use client'
import { Check, Lock } from 'lucide-react'
import { useHoldAcceptButton } from './useHoldAcceptButton'

export type HoldVariant = 'default' | 'accent'

interface Props {
  onConfirm: () => void | Promise<void>
  variant?: HoldVariant
  duration?: number
  disabled?: boolean
  label?: string
  confirmedLabel?: string
  pressingLabel?: string
}

export function HoldAcceptButton({
  onConfirm,
  variant = 'default',
  duration = 2000,
  disabled = false,
  label = 'Maintenir 2s pour accepter',
  confirmedLabel = 'Course acceptée',
  pressingLabel = 'Maintenez…',
}: Props) {
  const { state, start, cancel } = useHoldAcceptButton({ onConfirm, duration, disabled })

  const isPressing = state === 'pressing'
  const isConfirmed = state === 'confirmed'

  const baseColors =
    variant === 'accent' || isConfirmed ? 'bg-brand text-ink' : 'bg-ink text-paper'

  return (
    <button
      type="button"
      disabled={disabled}
      onPointerDown={(e) => {
        try { e.currentTarget.setPointerCapture(e.pointerId) } catch {}
        start()
      }}
      onPointerUp={cancel}
      onPointerCancel={cancel}
      onKeyDown={(e) => {
        if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) start()
      }}
      onKeyUp={(e) => {
        if (e.key === ' ' || e.key === 'Enter') cancel()
      }}
      aria-label="Maintenir 2 secondes pour accepter la course"
      className={`relative w-full h-[52px] md:h-[64px] px-4 md:px-6 rounded-xl overflow-hidden flex items-center justify-center gap-2 font-semibold text-[14px] md:text-[16px] select-none transition-transform duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${baseColors} ${isPressing ? 'scale-[0.98]' : ''}`}
    >
      {variant === 'default' && !isConfirmed && (
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 bg-brand pointer-events-none"
          style={{
            width: isPressing ? '100%' : '0%',
            transition: isPressing ? `width ${duration}ms linear` : 'none',
            opacity: 0.35,
            mixBlendMode: 'screen',
          }}
        />
      )}

      <span className="relative z-10 flex items-center gap-2">
        {state === 'idle' && (
          <>
            <Lock className="w-4 h-4" strokeWidth={1.8} />
            {label}
          </>
        )}
        {isPressing && (
          <>
            <Lock className="w-4 h-4 motion-safe:animate-pulse" strokeWidth={1.8} />
            {pressingLabel}
          </>
        )}
        {isConfirmed && (
          <>
            <Check className="w-5 h-5" strokeWidth={3} />
            {confirmedLabel}
          </>
        )}
      </span>

      {state !== 'idle' && (
        <svg className="relative z-10 w-6 h-6" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2" />
          <circle
            cx="12"
            cy="12"
            r="10"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="62.83"
            transform="rotate(-90 12 12)"
            strokeLinecap="round"
            style={{
              strokeDashoffset: isPressing ? 0 : isConfirmed ? 0 : 62.83,
              transition: isPressing ? `stroke-dashoffset ${duration}ms linear` : 'none',
            }}
          />
        </svg>
      )}
    </button>
  )
}
