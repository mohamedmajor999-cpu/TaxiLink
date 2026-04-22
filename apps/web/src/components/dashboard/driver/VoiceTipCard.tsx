'use client'
import { X, Lightbulb, AlertTriangle } from 'lucide-react'
import { useVoiceTipCard } from './useVoiceTipCard'

export function VoiceTipCard() {
  const { visible, hide, show } = useVoiceTipCard()

  if (!visible) {
    return (
      <button
        type="button"
        onClick={show}
        className="text-[12px] text-warm-500 hover:text-ink underline underline-offset-2 decoration-warm-300 hover:decoration-ink transition-colors"
      >
        Voir un exemple de dictée
      </button>
    )
  }

  return (
    <div className="relative w-full max-w-md rounded-2xl border border-warm-200 bg-paper p-3 pr-9 text-left shadow-sm">
      <button
        type="button"
        onClick={hide}
        aria-label="Masquer l'exemple"
        className="absolute top-2 right-2 w-6 h-6 rounded-md flex items-center justify-center text-warm-400 hover:text-ink hover:bg-warm-100 transition-colors"
      >
        <X className="w-3.5 h-3.5" strokeWidth={2} />
      </button>
      <div className="flex items-center gap-1.5 mb-1.5">
        <Lightbulb className="w-3.5 h-3.5 text-brand" strokeWidth={2.5} />
        <span className="text-[11px] font-bold uppercase tracking-wider text-warm-500">Exemple</span>
      </div>
      <p className="text-[12px] text-warm-700 leading-relaxed">
        «&nbsp;CPAM dialyse, Mme Dupont, <span className="font-semibold text-ink">demain</span> 14h30, départ 15 rue Paradis <span className="font-semibold text-ink">Marseille</span>, arrivée Hôpital Nord <span className="font-semibold text-ink">Marseille</span>, 45 euros&nbsp;»
      </p>
      <div className="mt-2 flex items-start gap-1.5 text-[11px] text-warm-600">
        <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-danger" strokeWidth={2} />
        <span>Précisez <span className="font-semibold text-ink">toujours la ville</span> au départ et à l&apos;arrivée.</span>
      </div>
    </div>
  )
}
