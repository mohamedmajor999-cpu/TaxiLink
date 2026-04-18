'use client'
import { Mic, Loader2 } from 'lucide-react'
import { VoiceTipCard } from './VoiceTipCard'

interface Props {
  isSupported: boolean
  isListening: boolean
  isProcessing: boolean
  transcript: string
  interimTranscript: string
  error: string | null
  onStart: () => void
  onStop: () => void
}

export function VoiceMicButton({
  isSupported, isListening, isProcessing,
  transcript, interimTranscript, error,
  onStart, onStop,
}: Props) {
  const disabled = !isSupported || isProcessing
  const unsupportedLabel = 'Non supporté par votre navigateur'
  const label = !isSupported ? unsupportedLabel : isListening ? 'Arrêter la dictée' : 'Démarrer la dictée vocale'

  const btnClass = disabled
    ? 'bg-warm-100 text-warm-500 cursor-not-allowed'
    : isListening
      ? 'bg-brand text-ink'
      : 'bg-warm-100 text-warm-500 hover:bg-warm-200'

  const hint = error
    ? error
    : isProcessing
      ? 'Analyse en cours\u2026'
      : isListening
        ? (transcript
            ? `${transcript}${interimTranscript ? ' ' + interimTranscript : ''}`
            : interimTranscript || 'J\u2019\u00e9coute\u2026')
        : 'Dictez : type, adresses, heure, prix\u2026'

  return (
    <div className="flex flex-col items-center text-center gap-2 mb-8">
      <button
        type="button"
        disabled={disabled}
        onClick={isListening ? onStop : onStart}
        aria-label={label}
        title={!isSupported ? unsupportedLabel : undefined}
        className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-colors ${btnClass}`}
      >
        {isListening && <span className="absolute inset-0 rounded-full bg-brand/40 animate-ping" />}
        {isProcessing
          ? <Loader2 className="relative w-8 h-8 animate-spin" strokeWidth={1.8} />
          : <Mic className="relative w-8 h-8" strokeWidth={1.8} />}
      </button>
      <p className="text-[13px] text-warm-500 min-h-[1.25rem] max-w-sm line-clamp-2">{hint}</p>

      {isSupported && !isListening && !isProcessing && !error && !transcript && (
        <VoiceTipCard />
      )}
    </div>
  )
}
