'use client'
import { Icon } from '@/components/ui/Icon'

interface Props {
  onBack: () => void
  onStartVocal: () => void
  voiceSupported: boolean
}

/**
 * Barre supérieure de la page « Nouvelle course » : retour façon page native +
 * bouton « Tout dicter » qui ouvre l'écran immersif Mains libres.
 * Le détail de l'enregistrement (pulse rouge, transcript, relances TTS) est
 * géré par MissionFormVocal sur l'écran dédié.
 */
export function PosterHeader({ onBack, onStartVocal, voiceSupported }: Props) {
  return (
    <div className="px-6 pt-4 pb-1 flex items-center justify-between">
      <button
        type="button" aria-label="Retour" onClick={onBack}
        className="w-9 h-9 rounded-full hover:bg-warm-100 flex items-center justify-center -ml-2 text-ink"
      >
        <Icon name="arrow_back" size={24} />
      </button>
      <button
        type="button"
        onClick={onStartVocal}
        disabled={!voiceSupported}
        className="h-10 pl-1.5 pr-4 rounded-full bg-ink text-paper flex items-center gap-2 text-[12.5px] font-bold shadow-[0_4px_12px_-2px_rgba(0,0,0,0.25)] disabled:opacity-50"
      >
        <span className="w-7 h-7 rounded-full flex items-center justify-center bg-brand text-ink">
          <Icon name="mic" size={15} />
        </span>
        Tout dicter
      </button>
    </div>
  )
}
