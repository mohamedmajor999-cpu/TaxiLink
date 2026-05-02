'use client'
import { Icon } from '@/components/ui/Icon'
import type { usePosterVoiceFlow } from './usePosterVoiceFlow'

interface Props {
  onMenu: () => void
  hasNotif?: boolean
  flow: ReturnType<typeof usePosterVoiceFlow>
}

/**
 * Barre supérieure : burger qui ouvre le drawer de navigation app + bouton
 * « Tout dicter » qui démarre/arrête la dictée IN-PAGE. L'état complet du
 * micro (listening / processing / asking) est rendu dans PosterVoiceBanner
 * sous ce header.
 */
export function PosterHeader({ onMenu, hasNotif, flow }: Props) {
  const listening = flow.status === 'listening'
  return (
    <div className="px-6 pt-4 pb-1 flex items-center justify-between md:justify-end md:px-0">
      <button
        type="button" aria-label="Ouvrir le menu" onClick={onMenu}
        className="md:hidden relative w-9 h-9 rounded-full hover:bg-warm-100 flex items-center justify-center -ml-2 text-ink"
      >
        <Icon name="menu" size={24} />
        {hasNotif && (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-danger ring-2 ring-paper" aria-hidden="true" />
        )}
      </button>
      <button
        type="button"
        onClick={flow.toggle}
        disabled={!flow.isSupported}
        aria-pressed={flow.isActive}
        className={`relative h-12 pl-2 pr-5 rounded-full flex items-center gap-2.5 text-[13.5px] font-extrabold shadow-fab disabled:opacity-50 transition-colors ${
          listening ? 'bg-danger text-paper' : flow.isActive ? 'bg-warm-700 text-paper' : 'bg-ink text-paper hover:bg-warm-800'
        }`}
      >
        {listening && <span className="absolute inset-0 rounded-full ring-2 ring-danger/60 motion-safe:animate-ping" aria-hidden="true" />}
        <span className={`relative w-9 h-9 rounded-full flex items-center justify-center ${
          listening ? 'bg-paper text-danger' : 'bg-brand text-ink'
        }`}>
          <Icon name="mic" size={20} className="relative" />
        </span>
        <span className="relative">
          {flow.isActive ? 'Arrêter' : 'Tout dicter'}
        </span>
      </button>
    </div>
  )
}
