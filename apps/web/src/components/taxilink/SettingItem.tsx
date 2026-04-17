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

const TONE_CLASSES: Record<Tone, string> = {
  default: 'border-t border-warm-100 hover:bg-warm-50 text-ink',
  'accent-soft': 'border-t border-warm-100 bg-brand/10 hover:bg-brand/20 text-ink',
  danger: 'border-t border-warm-100 text-danger hover:bg-danger-soft',
}

export function SettingItem({ icon, label, description, right, tone = 'default', onClick }: Props) {
  const showChevron = right === undefined && tone !== 'danger'
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3.5 px-4 py-3 text-left transition-colors ${TONE_CLASSES[tone]}`}
    >
      <span className="w-[18px] h-[18px] shrink-0 flex items-center justify-center text-warm-600">
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[13.5px] font-medium">{label}</div>
        {description && (
          <div className="text-[11.5px] text-warm-500 mt-0.5 truncate">{description}</div>
        )}
      </div>
      {right}
      {showChevron && <ChevronRight className="w-4 h-4 text-warm-400 shrink-0" strokeWidth={1.6} />}
    </button>
  )
}
