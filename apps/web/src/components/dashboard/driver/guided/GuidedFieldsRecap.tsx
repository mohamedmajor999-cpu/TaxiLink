'use client'

import { Check, Pencil } from 'lucide-react'
import type { Group } from '@taxilink/core'
import type { MissionFormState } from '../useMissionFormState'
import { formatFieldValue } from './guidedDisplayValue'
import type { GuidedQuestion } from './guidedTypes'

interface Props {
  form: MissionFormState
  myGroups: Group[]
  visibleQuestions: GuidedQuestion[]
  currentIndex: number
  onEdit: (id: string) => void
  variant?: 'inline' | 'summary'
}

/**
 * Affiche la liste des questions du flux guidé avec leur valeur courante.
 * - `inline` : compact, sous la question en cours (uniquement les champs déjà remplis).
 * - `summary` : complet, écran de fin, tous les champs avec bouton modifier.
 */
export function GuidedFieldsRecap({
  form, myGroups, visibleQuestions, currentIndex, onEdit, variant = 'inline',
}: Props) {
  const isSummary = variant === 'summary'
  const filledBefore = visibleQuestions.filter((_, i) => i < currentIndex)

  if (!isSummary && filledBefore.length === 0) return null

  const rows = isSummary ? visibleQuestions : filledBefore

  return (
    <div className={isSummary ? 'space-y-2' : 'mt-6 pt-4 border-t border-warm-100 space-y-1.5'}>
      {!isSummary && (
        <p className="text-[11px] font-bold uppercase tracking-wider text-warm-400 mb-2">
          Déjà rempli
        </p>
      )}
      {rows.map((q) => {
        const value = formatFieldValue(q.id, form, myGroups)
        const filled = value !== null
        return (
          <button
            key={q.id}
            type="button"
            onClick={() => onEdit(q.id)}
            className={`w-full text-left flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors ${
              isSummary
                ? 'border border-warm-200 hover:border-ink hover:bg-warm-50'
                : 'hover:bg-warm-50'
            }`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {filled ? (
                <Check className="w-4 h-4 text-brand-700" strokeWidth={2.5} />
              ) : (
                <span className="block w-4 h-4 rounded-full border border-warm-300" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-semibold text-warm-500">{q.shortLabel}</div>
              <div className={`text-[14px] ${filled ? 'text-ink' : 'text-warm-400 italic'} truncate`}>
                {filled ? value : 'Non renseigné'}
              </div>
            </div>
            <Pencil className="flex-shrink-0 w-3.5 h-3.5 text-warm-400 mt-1" strokeWidth={2} />
          </button>
        )
      })}
    </div>
  )
}
