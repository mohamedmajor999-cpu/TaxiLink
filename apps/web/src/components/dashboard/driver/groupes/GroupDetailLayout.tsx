'use client'
import { ArrowLeft } from 'lucide-react'

interface ShellProps {
  children:   React.ReactNode
  onBack:     () => void
  rightSlot?: React.ReactNode
}

export function GroupDetailShell({ children, onBack, rightSlot }: ShellProps) {
  return (
    <div className="px-4 md:px-8 py-3 md:py-6 max-w-2xl md:max-w-3xl mx-auto pb-24 md:pb-6">
      <header className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-[13px] font-semibold text-warm-600 hover:text-ink transition-colors"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={2} />
          Retour
        </button>
        {rightSlot}
      </header>
      {children}
    </div>
  )
}

interface StatProps {
  value: string
  label: string
  dot?:  boolean
}

export function GroupDetailStat({ value, label, dot = false }: StatProps) {
  return (
    <div className="px-2 text-center">
      <p className="text-[20px] font-bold text-ink leading-none tabular-nums">
        {dot && <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 align-middle mr-1.5" />}
        {value}
      </p>
      <p className="text-[11px] text-warm-500 mt-1.5">{label}</p>
    </div>
  )
}
