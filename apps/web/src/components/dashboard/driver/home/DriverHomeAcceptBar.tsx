'use client'
import { Hand, Megaphone } from 'lucide-react'
import { HoldAcceptButton } from '@/components/taxilink/HoldAcceptButton'

interface Props {
  onAccept: () => void | Promise<void>
  onShowDetail: () => void
  disabled?: boolean
  emptyLabel?: string
  /** Si true, la mission selectionnee est postee par le user lui-meme :
   *  on remplace le bouton Accepter par un etat 'Votre annonce' non-cliquable. */
  ownMission?: boolean
}

export function DriverHomeAcceptBar({ onAccept, onShowDetail, disabled, emptyLabel, ownMission }: Props) {
  if (disabled) {
    return (
      <div
        role="status"
        className="w-full h-[52px] md:h-14 px-4 md:px-5 rounded-2xl bg-paper dark:bg-night-surface border border-warm-200 dark:border-night-border text-warm-500 dark:text-night-text-soft font-bold text-[13px] md:text-[14px] flex items-center justify-center gap-2"
      >
        <Hand className="w-4 h-4" strokeWidth={2} />
        {emptyLabel ?? 'Sélectionnez une annonce'}
      </div>
    )
  }

  if (ownMission) {
    return (
      <div className="flex gap-2 w-full items-stretch">
        <div
          role="status"
          aria-label="Votre annonce, vous ne pouvez pas l'accepter"
          className="flex-1 min-w-0 h-[52px] md:h-16 px-4 rounded-xl bg-brand/15 border-2 border-dashed border-brand text-ink font-extrabold text-[13px] md:text-[14px] inline-flex items-center justify-center gap-2"
        >
          <Megaphone className="w-4 h-4" strokeWidth={2.4} />
          Votre annonce
        </div>
        <button
          type="button"
          onClick={onShowDetail}
          aria-label="Voir les détails de la course"
          className="shrink-0 h-[52px] md:h-16 px-3 md:px-4 rounded-xl bg-paper dark:bg-night-surface border border-warm-200 dark:border-night-border inline-flex items-center justify-center text-ink dark:text-night-text text-[12px] md:text-[13px] font-bold hover:bg-brand hover:border-ink dark:hover:bg-night-elevated transition-colors"
        >
          Détail
        </button>
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
        className="shrink-0 h-[52px] md:h-16 px-3 md:px-4 rounded-xl bg-paper dark:bg-night-surface border border-warm-200 dark:border-night-border inline-flex items-center justify-center text-ink dark:text-night-text text-[12px] md:text-[13px] font-bold hover:bg-brand hover:border-ink dark:hover:bg-night-elevated transition-colors"
      >
        Détail
      </button>
    </div>
  )
}
