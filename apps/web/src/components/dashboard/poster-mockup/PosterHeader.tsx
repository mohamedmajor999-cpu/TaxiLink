'use client'
import { Icon } from '@/components/ui/Icon'

interface Props {
  onMenu: () => void
  onBack: () => void
  hasNotif?: boolean
}

/**
 * Barre supérieure mobile : burger (gauche) qui ouvre le drawer de
 * navigation + bouton "Retour" pill (droite) pour revenir au dashboard.
 * Les deux sont visuellement distincts (burger = icone seule, Retour =
 * pill avec libelle) pour eviter toute confusion ou superposition.
 */
export function PosterHeader({ onMenu, onBack, hasNotif }: Props) {
  return (
    <div className="px-6 pt-4 pb-1 flex items-center justify-between md:hidden">
      <button
        type="button" aria-label="Ouvrir le menu" onClick={onMenu}
        className="relative w-9 h-9 rounded-full hover:bg-warm-100 flex items-center justify-center -ml-2 text-ink"
      >
        <Icon name="menu" size={24} />
        {hasNotif && (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-danger ring-2 ring-paper" aria-hidden="true" />
        )}
      </button>
      <button
        type="button"
        onClick={onBack}
        aria-label="Retour au dashboard"
        className="inline-flex items-center gap-1.5 h-9 pl-2 pr-3.5 rounded-full bg-warm-100 text-ink text-[12.5px] font-bold hover:bg-warm-200 transition-colors"
      >
        <Icon name="arrow_back" size={18} />
        Retour
      </button>
    </div>
  )
}
