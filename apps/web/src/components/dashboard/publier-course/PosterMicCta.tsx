'use client'
import { Icon } from '@/components/ui/Icon'
import type { usePosterVoiceFlow } from './usePosterVoiceFlow'

interface Props {
  flow: ReturnType<typeof usePosterVoiceFlow>
}

/**
 * Gros bouton micro mis en avant en haut du formulaire. Le but : que le
 * chauffeur ne le rate pas et puisse remplir l'annonce a la voix sans
 * fouiller. Reprend l'etat du flow vocal (idle / listening / processing /
 * asking) avec un visuel different selon le cas.
 */
export function PosterMicCta({ flow }: Props) {
  const isListening = flow.status === 'listening'
  const isProcessing = flow.status === 'processing'
  const isAsking = flow.status === 'asking'
  const active = flow.isActive
  const disabled = !flow.isSupported

  const tone =
    !flow.isSupported ? 'disabled'
    : isListening ? 'listening'
    : isProcessing ? 'processing'
    : isAsking ? 'asking'
    : 'idle'

  const btnClass = (() => {
    switch (tone) {
      case 'disabled':  return 'bg-warm-100 text-warm-400 cursor-not-allowed shadow-none'
      case 'listening': return 'bg-danger text-paper shadow-fab-hover scale-105'
      case 'processing':return 'bg-warm-700 text-paper shadow-fab'
      case 'asking':    return 'bg-ink text-brand shadow-fab'
      default:          return 'bg-ink text-brand shadow-fab hover:scale-105 active:scale-95'
    }
  })()

  const label = (() => {
    switch (tone) {
      case 'disabled':  return 'Micro non supporté'
      case 'listening': return 'J’écoute — appuie pour arrêter'
      case 'processing':return 'Analyse en cours…'
      case 'asking':    return 'Réponds à la question'
      default:          return 'Tout dicter à la voix'
    }
  })()

  const sub = (() => {
    switch (tone) {
      case 'disabled':  return 'Utilise Chrome, Edge ou Safari récent.'
      case 'listening': return 'Type, adresses, heure, prix… le micro se coupe au silence.'
      case 'processing':return 'Je remplis les champs avec ta dictée.'
      case 'asking':    return flow.lastQuestion ?? 'Question vocale en cours…'
      default:          return 'Le micro remplit type, adresses, heure et prix tout seul.'
    }
  })()

  return (
    <section className="px-6 pt-3 pb-6 lg:px-0">
      <div className="rounded-3xl border-2 border-warm-200 bg-gradient-to-br from-paper via-paper to-brand-soft/40 p-5 flex items-center gap-4">
        <div className="relative shrink-0">
          {tone === 'idle' && (
            <>
              <span className="pointer-events-none absolute inset-0 rounded-full bg-brand/30 motion-safe:animate-ping" aria-hidden="true" />
              <span className="pointer-events-none absolute -inset-2 rounded-full bg-brand/20 blur-lg" aria-hidden="true" />
            </>
          )}
          {tone === 'listening' && (
            <span className="pointer-events-none absolute inset-0 rounded-full bg-danger/40 motion-safe:animate-ping" aria-hidden="true" />
          )}
          <button
            type="button"
            onClick={flow.toggle}
            disabled={disabled}
            aria-pressed={active}
            aria-label={label}
            className={`relative w-20 h-20 lg:w-24 lg:h-24 rounded-full inline-flex items-center justify-center transition-all duration-200 ${btnClass}`}
          >
            <Icon
              name={isProcessing ? 'autorenew' : isAsking ? 'volume_up' : 'mic'}
              size={36}
              className={`relative ${isProcessing ? 'motion-safe:animate-spin' : ''}`}
            />
          </button>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-extrabold text-ink leading-tight">{label}</div>
          <p className="mt-1 text-[12.5px] text-warm-500 leading-snug line-clamp-2">{sub}</p>
        </div>
      </div>
    </section>
  )
}
