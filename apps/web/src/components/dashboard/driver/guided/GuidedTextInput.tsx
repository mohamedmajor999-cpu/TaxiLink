'use client'

import type { GuidedInputKind } from './guidedTypes'

interface Props {
  kind: Extract<GuidedInputKind, 'text' | 'phone' | 'date' | 'time'>
  value: unknown
  onChange: (value: string) => void
  placeholder?: string
  autoFocus?: boolean
  onSubmit?: () => void
}

const INPUT_ATTRS: Record<Props['kind'], { type: string; inputMode?: string; placeholder: string }> = {
  text:  { type: 'text', placeholder: 'Votre réponse' },
  phone: { type: 'tel',  inputMode: 'tel',     placeholder: '06 12 34 56 78' },
  date:  { type: 'date', placeholder: '' },
  time:  { type: 'time', placeholder: '' },
}

export function GuidedTextInput({ kind, value, onChange, autoFocus, onSubmit }: Props) {
  const attrs = INPUT_ATTRS[kind]
  const str = typeof value === 'string' ? value : ''
  return (
    <input
      type={attrs.type}
      inputMode={attrs.inputMode as 'tel' | undefined}
      placeholder={attrs.placeholder}
      value={str}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => { if (e.key === 'Enter' && onSubmit) { e.preventDefault(); onSubmit() } }}
      autoFocus={autoFocus}
      className="w-full h-12 px-4 rounded-xl border border-warm-200 focus:border-ink focus:outline-none text-[15px] text-ink transition-colors tabular-nums"
    />
  )
}
