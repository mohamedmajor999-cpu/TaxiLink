'use client'
import { Icon } from '@/components/ui/Icon'

interface Props {
  onMenu: () => void
  hasNotif?: boolean
}

/**
 * Barre supérieure mobile : burger qui ouvre le drawer de navigation app.
 * Le déclenchement du micro vit dans PosterMicCta (gros bouton dans le
 * corps de la page) — plus besoin d'un raccourci en haut a droite.
 */
export function PosterHeader({ onMenu, hasNotif }: Props) {
  return (
    <div className="px-6 pt-4 pb-1 flex items-center md:hidden">
      <button
        type="button" aria-label="Ouvrir le menu" onClick={onMenu}
        className="relative w-9 h-9 rounded-full hover:bg-warm-100 flex items-center justify-center -ml-2 text-ink"
      >
        <Icon name="menu" size={24} />
        {hasNotif && (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-danger ring-2 ring-paper" aria-hidden="true" />
        )}
      </button>
    </div>
  )
}
