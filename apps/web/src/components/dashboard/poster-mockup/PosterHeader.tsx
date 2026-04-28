'use client'
import { Icon } from '@/components/ui/Icon'

interface VoiceState {
  isSupported: boolean
  isListening: boolean
  isProcessing: boolean
  interimTranscript: string
  start: () => void
  stop: () => void
}

interface Props {
  onBack: () => void
  voice: VoiceState
}

/**
 * Barre supérieure de la page « Nouvelle course » : bouton retour façon page
 * native + bouton « Tout dicter » avec rendu visiblement actif quand le micro
 * enregistre (pulse rouge + bandeau interim transcript).
 */
export function PosterHeader({ onBack, voice }: Props) {
  return (
    <>
      <div className="px-6 pt-4 pb-1 flex items-center justify-between">
        <button
          type="button" aria-label="Retour" onClick={onBack}
          className="w-9 h-9 rounded-full hover:bg-warm-100 flex items-center justify-center -ml-2 text-ink"
        >
          <Icon name="arrow_back" size={24} />
        </button>
        <button
          type="button"
          onClick={() => (voice.isListening ? voice.stop() : voice.start())}
          disabled={!voice.isSupported || voice.isProcessing}
          className={`relative h-10 pl-1.5 pr-4 rounded-full flex items-center gap-2 text-[12.5px] font-bold shadow-[0_4px_12px_-2px_rgba(0,0,0,0.25)] disabled:opacity-50 transition-colors ${
            voice.isListening
              ? 'bg-danger text-paper'
              : voice.isProcessing
                ? 'bg-warm-200 text-ink'
                : 'bg-ink text-paper'
          }`}
        >
          {voice.isListening && <span className="absolute inset-0 rounded-full ring-2 ring-danger/50 motion-safe:animate-ping" aria-hidden="true" />}
          <span className={`relative w-7 h-7 rounded-full flex items-center justify-center ${
            voice.isListening ? 'bg-paper text-danger' : 'bg-brand text-ink'
          }`}>
            {voice.isListening && <span className="absolute inset-0 rounded-full bg-danger/30 motion-safe:animate-ping" aria-hidden="true" />}
            <Icon name="mic" size={15} className="relative" />
          </span>
          <span className="relative">
            {voice.isListening ? 'Enregistrement…' : voice.isProcessing ? 'Analyse…' : 'Tout dicter'}
          </span>
        </button>
      </div>
      {voice.isListening && (
        <div className="px-6 pt-2">
          <div className="flex items-center gap-2 rounded-full bg-danger/10 border border-danger/30 px-3 py-1.5">
            <span className="w-2 h-2 rounded-full bg-danger motion-safe:animate-pulse shrink-0" aria-hidden="true" />
            <span className="text-[12px] font-semibold text-danger truncate">
              {voice.interimTranscript || 'Parlez maintenant — appuyez à nouveau pour arrêter.'}
            </span>
          </div>
        </div>
      )}
    </>
  )
}
