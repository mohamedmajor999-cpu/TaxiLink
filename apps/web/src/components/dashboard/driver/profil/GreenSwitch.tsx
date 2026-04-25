'use client'

interface Props {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
}

export function GreenSwitch({ checked, onChange, label }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={(e) => { e.stopPropagation(); onChange(!checked) }}
      className={`relative w-10 h-6 rounded-full transition-colors shrink-0 ${checked ? 'bg-emerald-500' : 'bg-warm-300'}`}
    >
      <span
        className={`absolute top-0.5 w-5 h-5 rounded-full bg-paper shadow-button transition-all ${checked ? 'left-[18px]' : 'left-0.5'}`}
      />
    </button>
  )
}
