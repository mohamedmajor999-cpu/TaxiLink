'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getVisibleQuestions } from './guidedQuestions'
import type { GuidedQuestion, GuidedVisibilityState } from './guidedTypes'
import type { VoiceAnswerResult } from '@/services/voiceAnswerService'

interface Options {
  state: GuidedVisibilityState
  apply: (id: string, value: unknown) => Promise<void>
  onComplete?: () => void
}

/**
 * Orchestrateur du flux guidé : calcule la liste des questions visibles,
 * maintient la question courante, et applique navigation + réponses.
 *
 * La liste visible change dynamiquement (ex: passer de CPAM à Privé retire des
 * questions) : on ancre la position sur l'id courant, pas sur l'index.
 *
 * À la dernière question, `advance` bascule `isComplete=true` et déclenche
 * `onComplete` (typiquement : afficher l'aperçu). Le composant parent garde
 * le flux monté pendant l'aperçu pour préserver la position courante.
 */
export function useGuidedMissionFlow({ state, apply, onComplete }: Options) {
  const visibleQuestions = useMemo<GuidedQuestion[]>(() => getVisibleQuestions(state), [state])
  const [currentId, setCurrentId] = useState<string | null>(visibleQuestions[0]?.id ?? null)
  const [isComplete, setIsComplete] = useState(false)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    if (isComplete) return
    if (!currentId || !visibleQuestions.some((q) => q.id === currentId)) {
      setCurrentId(visibleQuestions[0]?.id ?? null)
    }
  }, [visibleQuestions, currentId, isComplete])

  const currentIndex = currentId ? visibleQuestions.findIndex((q) => q.id === currentId) : -1
  const currentQuestion = currentIndex >= 0 ? visibleQuestions[currentIndex]! : null
  const progress = visibleQuestions.length > 0 && currentIndex >= 0
    ? (currentIndex + 1) / visibleQuestions.length
    : 0

  // `nextState` (optionnel) permet à `answer` de passer l'état post-réponse,
  // afin de calculer la bonne liste visible sans attendre le prochain render
  // (sinon le useEffect plus bas rembobine vers la question 0 quand la réponse
  // a masqué la question suivante).
  const advance = useCallback((nextState?: GuidedVisibilityState) => {
    const list = nextState ? getVisibleQuestions(nextState) : visibleQuestions
    const idx = currentId ? list.findIndex((q) => q.id === currentId) : -1
    if (idx < 0) {
      setCurrentId(list[0]?.id ?? null)
      return
    }
    const nextIdx = idx + 1
    if (nextIdx >= list.length) {
      setIsComplete(true)
      onCompleteRef.current?.()
    } else {
      setCurrentId(list[nextIdx]!.id)
    }
  }, [currentId, visibleQuestions])

  const answer = useCallback(
    async (value: unknown) => {
      if (!currentQuestion) return
      await apply(currentQuestion.id, value)
      advance(computeNextVisibility(state, currentQuestion.id, value))
    },
    [apply, advance, currentQuestion, state],
  )

  const skip = useCallback(() => {
    if (!currentQuestion?.optional) return
    advance()
  }, [advance, currentQuestion])

  const back = useCallback(() => {
    setIsComplete(false)
    if (currentIndex <= 0) return
    setCurrentId(visibleQuestions[currentIndex - 1]!.id)
  }, [currentIndex, visibleQuestions])

  const goTo = useCallback(
    (id: string) => {
      if (visibleQuestions.some((q) => q.id === id)) {
        setIsComplete(false)
        setCurrentId(id)
      }
    },
    [visibleQuestions],
  )

  const handleVoiceResult = useCallback(
    async (result: VoiceAnswerResult) => {
      switch (result.intent) {
        case 'answer':  await answer(result.value); return
        case 'skip':    skip(); return
        case 'back':    back(); return
        case 'goto':    if (result.targetQuestionId) goTo(result.targetQuestionId); return
        case 'unclear': return
      }
    },
    [answer, back, skip, goTo],
  )

  return {
    currentQuestion,
    currentIndex,
    totalQuestions: visibleQuestions.length,
    visibleQuestions,
    progress,
    isComplete,
    answer, skip, back, goTo,
    handleVoiceResult,
  }
}

/**
 * Projette la réponse courante sur l'état de visibilité, sans attendre le
 * re-render de MissionFormState. Seules les 3 clés qui gouvernent la visibilité
 * (type, returnTrip, visibility) sont mises à jour ; les autres réponses
 * n'affectent pas la liste des questions visibles.
 */
function computeNextVisibility(
  state: GuidedVisibilityState,
  id: string,
  value: unknown,
): GuidedVisibilityState {
  switch (id) {
    case 'type':
      if (value === 'CPAM' || value === 'PRIVE' || value === 'TAXILINK') {
        const next: GuidedVisibilityState = { ...state, type: value }
        if (value !== 'CPAM') next.returnTrip = false
        return next
      }
      return state
    case 'returnTrip':
      return { ...state, returnTrip: !!value }
    case 'visibility':
      if (value === 'PUBLIC' || value === 'GROUP') return { ...state, visibility: value }
      return state
    default:
      return state
  }
}
