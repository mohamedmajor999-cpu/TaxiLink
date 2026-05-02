'use client'
import { Mic, Loader2, Sparkles } from 'lucide-react'
import { VoiceTipCard } from './VoiceTipCard'

interface Props {
  isSupported: boolean
  isListening: boolean
  isProcessing: boolean
  transcript: string
  error: string | null
  onStart: () => void
  onStop: () => void
}

export function VoiceMicButton({
  isSupported, isListening, isProcessing,
  transcript, error,
  onStart, onStop,
}: Props) {
  const disabled = !isSupported || isProcessing
  const unsupportedLabel = 'Non supporté par votre navigateur'
  const label = !isSupported ? unsupportedLabel : isListening ? 'Arrêter la dictée' : 'Démarrer la dictée vocale'

  // Etat actif (ecoute) : jaune brand pleine + scale up
  // Etat repos : noir avec halo brand discret + ping doux pour appeler le geste
  // Etat indispo : gris desature
  const btnClass = disabled
    ? 'bg-warm-100 text-warm-500 cursor-not-allowed shadow-none'
    : isListening
      ? 'bg-brand text-ink scale-105 shadow-fab-hover'
      : 'bg-ink text-brand hover:scale-105 shadow-fab'

  const hint = error
    ? error
    : isProcessing
      ? 'Analyse en cours…'
      : isListening
        ? 'J’écoute… Touchez à nouveau le micro pour arrêter.'
        : transcript
          ? transcript
          : 'Touchez le micro et dictez : type, adresses, heure, prix…'

  return (
    <div className="flex flex-col items-center text-center gap-3 mb-6">
      <div className="relative">
        {/* Halo doux idle, attire l'oeil sans bouger frenetiquement */}
        {!disabled && !isListening && (
          <span className="pointer-events-none absolute inset-0 rounded-full bg-brand/30 motion-safe:animate-ping" aria-hidden="true" />
        )}
        {!disabled && !isListening && (
          <span className="pointer-events-none absolute -inset-3 rounded-full bg-brand/15 blur-xl" aria-hidden="true" />
        )}
        <button
          type="button"
          disabled={disabled}
          onClick={isListening ? onStop : onStart}
          aria-label={label}
          aria-pressed={isListening}
          title={!isSupported ? unsupportedLabel : undefined}
          className={`relative w-28 h-28 rounded-full inline-flex items-center justify-center transition-all duration-200 active:scale-95 ${btnClass}`}
        >
          {isListening && <span className="absolute inset-0 rounded-full bg-brand/50 motion-safe:animate-ping" aria-hidden="true" />}
          {isProcessing
            ? <Loader2 className="relative w-11 h-11 motion-safe:animate-spin" strokeWidth={2} />
            : <Mic className="relative w-11 h-11" strokeWidth={2} />}
          {!disabled && !isListening && (
            <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-brand drop-shadow" strokeWidth={2.5} aria-hidden="true" />
          )}
        </button>
      </div>

      <div className="flex flex-col items-center gap-1">
        <span className="text-[13px] font-bold uppercase tracking-[0.08em] text-ink">
          {isListening ? 'J’écoute' : isProcessing ? 'Analyse' : 'Dictée vocale'}
        </span>
        <p className="text-[12.5px] text-warm-500 min-h-[1.25rem] max-w-sm line-clamp-2 leading-relaxed">{hint}</p>
      </div>

      {isSupported && !isListening && !isProcessing && !error && !transcript && (
        <VoiceTipCard />
      )}
    </div>
  )
}
