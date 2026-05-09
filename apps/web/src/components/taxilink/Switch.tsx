'use client'

type Tone = 'ink' | 'success'

interface Props {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  tone?: Tone
  disabled?: boolean
}

const TONE_ON: Record<Tone, string> = {
  ink: 'bg-ink',
  success: 'bg-emerald-500',
}

export function Switch({ checked, onChange, label, tone = 'ink', disabled }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={(e) => { e.stopPropagation(); if (!disabled) onChange(!checked) }}
      className={`relative w-10 h-6 rounded-full transition-colors shrink-0 ${checked ? TONE_ON[tone] : 'bg-warm-300'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span
        className={`absolute top-0.5 w-5 h-5 rounded-full bg-paper shadow-button transition-all ${checked ? 'left-[18px]' : 'left-0.5'}`}
      />
    </button>
  )
}
