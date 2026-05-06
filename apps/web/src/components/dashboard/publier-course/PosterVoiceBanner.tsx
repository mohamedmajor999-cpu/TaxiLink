'use client'
import { Icon } from '@/components/ui/Icon'
import type { usePosterVoiceFlow } from './usePosterVoiceFlow'

interface Props {
  flow: ReturnType<typeof usePosterVoiceFlow>
}

/**
 * Bandeau d'état du micro affiché en haut du formulaire pendant que la dictée
 * tourne. Pas de changement d'écran — l'utilisateur voit ses champs se remplir
 * en direct pendant que la voix pose les questions manquantes.
 */
export function PosterVoiceBanner({ flow }: Props) {
  if (!flow.isActive) return null

  const isListening = flow.status === 'listening'
  const isProcessing = flow.status === 'processing'
  const isAsking = flow.status === 'asking'

  const tone = isAsking ? 'asking' : isProcessing ? 'processing' : 'listening'
  const cls = tone === 'asking'
    ? 'bg-ink/95 text-paper border-ink/50'
    : tone === 'processing'
      ? 'bg-warm-100 text-ink border-warm-200'
      : 'bg-danger/10 text-danger border-danger/30'
  const iconName = tone === 'asking' ? 'volume_up' : tone === 'processing' ? 'autorenew' : null
  const title = tone === 'asking' ? 'Question vocale'
    : tone === 'processing' ? 'Analyse en cours…'
    : 'J’écoute…'
  const body = tone === 'asking'
    ? (flow.lastQuestion ?? '')
    : tone === 'listening'
      ? 'Parlez maintenant, puis touchez le micro pour arrêter.'
      : 'Je remplis les champs avec votre dictée.'

  return (
    <div className="px-6 pt-2 pb-1">
      <div className={`flex items-start gap-3 rounded-2xl border px-3 py-2.5 ${cls}`}>
        <span className="relative w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-paper/30">
          {tone === 'listening' && <span className="absolute inset-0 rounded-full bg-danger/40 motion-safe:animate-ping" aria-hidden="true" />}
          {iconName ? (
            <Icon name={iconName} size={16} className={`relative ${tone === 'processing' ? 'motion-safe:animate-spin' : ''}`} />
          ) : (
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true" className="relative">
              <rect x="6" y="6" width="12" height="12" rx="3" />
            </svg>
          )}
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-[11.5px] font-bold uppercase tracking-[0.04em] opacity-80">
            {title}
            {tone === 'asking' && flow.currentAttempt > 0 && (
              <span className="ml-2 opacity-70 normal-case tracking-normal">
                Tentative {flow.currentAttempt}/{flow.maxAttempts}
              </span>
            )}
          </div>
          <div className="text-[13px] font-semibold leading-snug truncate">{body}</div>
        </div>
        <button
          type="button" onClick={flow.stop} aria-label="Arrêter la dictée"
          className="shrink-0 w-7 h-7 rounded-full hover:bg-paper/20 flex items-center justify-center"
        >
          <Icon name="close" size={16} />
        </button>
      </div>
    </div>
  )
}
