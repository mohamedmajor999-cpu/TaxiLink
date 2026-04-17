'use client'
import { Check } from 'lucide-react'

interface FieldCardProps {
  label?: string
  children: React.ReactNode
  filled?: boolean
  compact?: boolean
}

export function FieldCard({ label, children, filled = false, compact = false }: FieldCardProps) {
  return (
    <div className={`rounded-2xl border border-warm-200 bg-paper mb-3 ${compact ? 'p-3' : 'p-4'}`}>
      {label && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-warm-500">{label}</span>
          {filled && (
            <span className="w-5 h-5 rounded-full bg-brand flex items-center justify-center">
              <Check className="w-3 h-3 text-ink" strokeWidth={2.5} />
            </span>
          )}
        </div>
      )}
      {children}
    </div>
  )
}

interface ChipProps {
  active: boolean
  children: React.ReactNode
  onClick?: () => void
  dot?: boolean
}

export function Chip({ active, children, onClick, dot = false }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-[13px] font-semibold transition-colors ${
        active ? 'bg-ink text-paper' : 'bg-paper text-ink border border-warm-200 hover:bg-warm-50'
      }`}
    >
      {active && dot && <span className="w-1.5 h-1.5 rounded-full bg-brand" />}
      {children}
    </button>
  )
}
