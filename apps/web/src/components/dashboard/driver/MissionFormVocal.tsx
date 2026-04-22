'use client'

import { Mic, Loader2, Volume2, CheckCircle2, ArrowRight } from 'lucide-react'
import type { useMissionVoiceFiller } from './useMissionVoiceFiller'
import { useVoiceFreeFlow } from './vocal/useVoiceFreeFlow'
import type { VocalFormSnapshot } from './vocal/missingCriticalFields'

interface Props {
  filler: ReturnType<typeof useMissionVoiceFiller>
  snapshot: () => VocalFormSnapshot
  onComplete: () => void
}

/** Écran immersif « Mains libres » : gros micro, TTS de relance, transcript live. */
export function MissionFormVocal({ filler, snapshot, onComplete }: Props) {
  const flow = useVoiceFreeFlow({ filler, snapshot, onComplete })

  if (!flow.isSupported) {
    return (
      <div className="px-4 md:px-8 py-10 max-w-2xl mx-auto text-center">
        <p className="text-[14px] text-warm-500">
          Le mode mains libres nécessite un navigateur compatible (Chrome, Edge, Safari récent).
        </p>
      </div>
    )
  }

  const busy = flow.isListening || flow.isProcessing || flow.isSpeaking
  const hint = flow.error
    ? flow.error
    : flow.isSpeaking
      ? flow.lastQuestion ?? 'Je pose une question…'
      : flow.isProcessing
        ? 'Analyse en cours…'
        : flow.isListening
          ? (flow.transcript
              ? `${flow.transcript}${flow.interimTranscript ? ' ' + flow.interimTranscript : ''}`
              : flow.interimTranscript || 'J’écoute…')
          : flow.status === 'idle' && flow.relanceCount === 0
            ? 'Appuyez pour parler. Dites le type, les adresses, la date et l’heure.'
            : 'Appuyez pour continuer.'

  return (
    <div className="px-4 md:px-8 py-10 max-w-2xl mx-auto flex flex-col items-center gap-6">
      <StatusBadge status={flow.status} />

      <button
        type="button"
        onClick={flow.isListening ? filler.stop : flow.start}
        disabled={flow.isProcessing || flow.isSpeaking}
        aria-label={flow.isListening ? 'Arrêter et analyser' : 'Démarrer la dictée'}
        className={`relative w-32 h-32 md:w-40 md:h-40 rounded-full flex items-center justify-center transition-colors ${
          flow.isListening
            ? 'bg-brand text-ink'
            : busy
              ? 'bg-warm-100 text-warm-500'
              : 'bg-ink text-paper hover:bg-warm-800'
        }`}
      >
        {flow.isListening && <span className="absolute inset-0 rounded-full bg-brand/40 animate-ping" />}
        {flow.isProcessing
          ? <Loader2 className="relative w-14 h-14 animate-spin" strokeWidth={1.6} />
          : flow.isSpeaking
            ? <Volume2 className="relative w-14 h-14" strokeWidth={1.6} />
            : <Mic className="relative w-14 h-14" strokeWidth={1.6} />}
      </button>

      <p className="text-[15px] text-ink text-center max-w-md min-h-[3rem] leading-relaxed">{hint}</p>

      {flow.relanceCount > 0 && (
        <p className="text-[12px] text-warm-500">
          Relance {flow.relanceCount} / {flow.maxRelances}
        </p>
      )}

      <button
        type="button"
        onClick={flow.skipToPreview}
        className="mt-2 inline-flex items-center gap-1.5 text-[13px] text-warm-500 hover:text-ink transition-colors"
      >
        Passer à l’aperçu
        <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
      </button>
    </div>
  )
}

function StatusBadge({ status }: { status: ReturnType<typeof useVoiceFreeFlow>['status'] }) {
  const label =
    status === 'listening' ? 'J’écoute' :
    status === 'processing' ? 'Analyse' :
    status === 'asking' ? 'Je parle' :
    status === 'complete' ? 'Prêt' :
    'Mains libres'
  const Icon = status === 'complete' ? CheckCircle2 : Mic
  return (
    <div className="inline-flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-[1.2px] px-3 py-1.5 rounded-full border border-warm-200 text-warm-600">
      <Icon className="w-3.5 h-3.5" strokeWidth={2} />
      {label}
    </div>
  )
}
