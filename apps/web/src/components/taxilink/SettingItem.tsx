'use client'
import type { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'

type Tone = 'default' | 'accent-soft' | 'danger'

interface Props {
  icon: ReactNode
  label: string
  description?: string
  right?: ReactNode
  tone?: Tone
  onClick?: () => void
}

const TONE_CARD: Record<Tone, string> = {
  default: 'bg-paper border-warm-200 hover:bg-warm-50 text-ink',
  'accent-soft': 'bg-brand-soft border-brand/40 hover:bg-brand/20 text-ink',
  danger: 'bg-danger-soft border-danger/20 text-danger hover:bg-danger/10',
}

const TONE_ICON_BG: Record<Tone, string> = {
  default: 'bg-warm-100 text-warm-800',
  'accent-soft': 'bg-paper text-ink',
  danger: 'bg-danger/10 text-danger',
}

export function SettingItem({
  icon, label, description, right, tone = 'default', onClick,
}: Props) {
  const showChevron = right === undefined && tone !== 'danger'
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border text-left transition-colors ${TONE_CARD[tone]}`}
    >
      <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${TONE_ICON_BG[tone]}`}>
        <span className="w-[18px] h-[18px] grid place-items-center">{icon}</span>
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-semibold leading-tight">{label}</div>
        {description && (
          <div className="text-[12px] text-warm-500 mt-0.5 truncate">{description}</div>
        )}
      </div>
      {right}
      {showChevron && <ChevronRight className="w-4 h-4 text-warm-400 shrink-0" strokeWidth={1.8} />}
    </button>
  )
}
