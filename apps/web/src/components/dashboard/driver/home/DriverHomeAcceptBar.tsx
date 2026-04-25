'use client'
import { Hand } from 'lucide-react'
import { HoldAcceptButton } from '@/components/taxilink/HoldAcceptButton'

interface Props {
  onAccept: () => void | Promise<void>
  onShowDetail: () => void
  disabled?: boolean
  emptyLabel?: string
}

export function DriverHomeAcceptBar({ onAccept, onShowDetail, disabled, emptyLabel }: Props) {
  if (disabled) {
    return (
      <div
        role="status"
        className="w-full h-[52px] md:h-14 px-4 md:px-5 rounded-2xl bg-paper dark:bg-warm-800 border border-warm-200 dark:border-warm-600 text-warm-500 dark:text-warm-300 font-bold text-[13px] md:text-[14px] flex items-center justify-center gap-2"
      >
        <Hand className="w-4 h-4" strokeWidth={2} />
        {emptyLabel ?? 'Sélectionnez une annonce'}
      </div>
    )
  }

  return (
    <div className="flex gap-2 w-full items-stretch">
      <div className="flex-1 min-w-0">
        <HoldAcceptButton onConfirm={onAccept} />
      </div>
      <button
        type="button"
        onClick={onShowDetail}
        aria-label="Voir les détails de la course"
        className="shrink-0 h-[52px] md:h-16 px-3 md:px-4 rounded-xl bg-paper dark:bg-warm-800 border border-warm-200 dark:border-warm-600 inline-flex items-center justify-center text-ink dark:text-paper text-[12px] md:text-[13px] font-bold hover:bg-brand hover:border-ink dark:hover:bg-warm-600 transition-colors"
      >
        Détail
      </button>
    </div>
  )
}
