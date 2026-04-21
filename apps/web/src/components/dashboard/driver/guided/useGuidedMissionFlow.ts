'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getVisibleQuestions } from './guidedQuestions'
import type { GuidedQuestion, GuidedVisibilityState } from './guidedTypes'
import type { VoiceAnswerResult } from '@/services/voiceAnswerService'

interface Options {
  state: GuidedVisibilityState
  apply: (id: string, value: unknown) => Promise<void>
  onComplete: () => void
}

/**
 * Orchestrateur du flux guidé : calcule la liste des questions visibles,
 * maintient la question courante, et applique navigation + réponses.
 *
 * La liste visible change dynamiquement (ex: passer de CPAM à Privé retire des
 * questions) : on ancre la position sur l'id courant, pas sur l'index.
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

  const advance = useCallback(() => {
    const idx = currentId ? visibleQuestions.findIndex((q) => q.id === currentId) : -1
    const nextList = getVisibleQuestions(state)
    if (idx < 0) {
      setCurrentId(nextList[0]?.id ?? null)
      return
    }
    const nextIdx = nextList.findIndex((q) => q.id === currentId) + 1
    if (nextIdx >= nextList.length) {
      setIsComplete(true)
      onCompleteRef.current()
    } else {
      setCurrentId(nextList[nextIdx]!.id)
    }
  }, [currentId, state, visibleQuestions])

  const answer = useCallback(
    async (value: unknown) => {
      if (!currentQuestion) return
      await apply(currentQuestion.id, value)
      advance()
    },
    [apply, advance, currentQuestion],
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
