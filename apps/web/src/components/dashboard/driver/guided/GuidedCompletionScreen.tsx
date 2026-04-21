'use client'

import { CheckCircle2 } from 'lucide-react'
import type { Group } from '@taxilink/core'
import type { MissionFormState } from '../useMissionFormState'
import { GuidedFieldsRecap } from './GuidedFieldsRecap'
import type { GuidedQuestion } from './guidedTypes'

interface Props {
  form: MissionFormState
  myGroups: Group[]
  visibleQuestions: GuidedQuestion[]
  onEdit: (id: string) => void
  onConfirm: () => void
}

/**
 * Écran de fin du flux guidé : récap complet avec boutons « modifier »
 * par champ + bouton de confirmation qui lance la prévisu.
 * Remplace le saut automatique vers la prévisu (qui perdait la position courante
 * au retour via « Modifier »).
 */
export function GuidedCompletionScreen({ form, myGroups, visibleQuestions, onEdit, onConfirm }: Props) {
  return (
    <div className="bg-paper pb-24 md:pb-6">
      <div className="px-4 md:px-8 pt-4 md:pt-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-brand-700">
          <CheckCircle2 className="w-4 h-4" strokeWidth={2.5} /> Terminé
        </div>
        <h2 className="mt-2 text-[22px] font-bold text-ink leading-snug tracking-tight">
          Récapitulatif de la course
        </h2>
        <p className="mt-1 text-[13px] text-warm-500">
          Vérifiez chaque champ et touchez pour corriger.
        </p>

        <div className="mt-5">
          <GuidedFieldsRecap
            form={form}
            myGroups={myGroups}
            visibleQuestions={visibleQuestions}
            currentIndex={-1}
            onEdit={onEdit}
            variant="summary"
          />
        </div>

        <button
          type="button"
          onClick={onConfirm}
          className="mt-6 w-full h-14 rounded-2xl bg-ink text-paper text-[15px] font-semibold inline-flex items-center justify-center gap-2 shadow-[0_8px_24px_-8px_rgba(10,10,10,0.35)] hover:bg-warm-800 hover:shadow-[0_10px_28px_-6px_rgba(10,10,10,0.45)] active:translate-y-px transition-all"
        >
          <CheckCircle2 className="w-[18px] h-[18px]" strokeWidth={2.2} />
          Voir l’aperçu
        </button>
      </div>
    </div>
  )
}
