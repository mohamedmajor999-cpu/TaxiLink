'use client'
import { Plus } from 'lucide-react'

interface Props {
  onClick: () => void
}

export function AgendaInlineAdd({ onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-paper border border-dashed border-warm-200 text-[12.5px] font-semibold text-warm-700 hover:bg-warm-50 hover:border-warm-300 transition-colors"
    >
      <span className="w-6 h-6 rounded-full bg-warm-50 grid place-items-center text-warm-500">
        <Plus className="w-4 h-4" strokeWidth={2.4} />
      </span>
      Ajouter une course à ce jour
    </button>
  )
}
