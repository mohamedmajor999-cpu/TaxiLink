'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Group } from '@taxilink/core'
import type { MissionFormState } from '../useMissionFormState'
import { initialValueForQuestion } from './guidedInitialValue'
import { useGuidedAnswerApplier, type GuidedSetters } from './useGuidedAnswerApplier'
import { useGuidedMissionFlow } from './useGuidedMissionFlow'
import { useGuidedVoiceAnswer } from './useGuidedVoiceAnswer'
import { useGuidedVoicePrompt } from './useGuidedVoicePrompt'
import type { GuidedQuestion } from './guidedTypes'

interface Options {
  form: MissionFormState
  myGroups: Group[]
  setters: GuidedSetters
  allQuestionIds: string[]
  onComplete: () => void
  voiceAutoSpeak: boolean
}

/**
 * État et handlers de l'écran du flux guidé : pilote la liste de questions,
 * le brouillon de la question courante, la lecture vocale et la dictée.
 */
export function useGuidedMissionScreen(opts: Options) {
  const { form, myGroups, setters, allQuestionIds, onComplete, voiceAutoSpeak } = opts

  const apply = useGuidedAnswerApplier(setters, myGroups)
  const flow = useGuidedMissionFlow({
    state: { type: form.type, returnTrip: form.returnTrip, visibility: form.visibility },
    apply,
    onComplete,
  })

  const [draft, setDraft] = useState<unknown>(null)
  const lastIdRef = useRef<string | null>(null)
  useEffect(() => {
    const id = flow.currentQuestion?.id ?? null
    if (id !== lastIdRef.current) {
      lastIdRef.current = id
      setDraft(id ? initialValueForQuestion(id, form) : null)
    }
  }, [flow.currentQuestion, form])

  const prompt = useGuidedVoicePrompt()
  const spokenIdRef = useRef<string | null>(null)

  const voice = useGuidedVoiceAnswer({
    question: flow.currentQuestion ?? FALLBACK_QUESTION,
    allQuestionIds,
    onResult: flow.handleVoiceResult,
  })

  // Session vocale : un clic sur le micro active une session qui auto-relance
  // le micro après chaque TTS jusqu'à la fin du flux ou arrêt manuel.
  const [voiceSession, setVoiceSession] = useState(false)

  // Le TTS ne se déclenche qu'une fois la session démarrée par l'utilisateur,
  // pour éviter la lecture automatique dès l'arrivée sur la page.
  useEffect(() => {
    if (!voiceSession) {
      spokenIdRef.current = null
      return
    }
    if (!voiceAutoSpeak || !prompt.isSupported) return
    const q = flow.currentQuestion
    if (!q || spokenIdRef.current === q.id) return
    spokenIdRef.current = q.id
    prompt.speak(q.prompt)
  }, [flow.currentQuestion, prompt, voiceAutoSpeak, voiceSession])
  const voiceStartRef = useRef(voice.start)
  voiceStartRef.current = voice.start

  // Démarrer la session active voiceSession ; le TTS parle la question, puis
  // l'effet d'auto-relance ci-dessous lance le micro une fois le TTS terminé.
  const startVoiceSession = useCallback(() => {
    setVoiceSession(true)
  }, [])

  const stopVoiceSession = useCallback(() => {
    setVoiceSession(false)
    voice.stop()
    prompt.stop()
  }, [voice, prompt])

  useEffect(() => {
    if (!voiceSession) return
    if (flow.isComplete) { setVoiceSession(false); return }
    if (!flow.currentQuestion) return
    if (voice.isListening || voice.isProcessing || prompt.isSpeaking) return
    const t = setTimeout(() => voiceStartRef.current(), 150)
    return () => clearTimeout(t)
  }, [voiceSession, flow.currentQuestion, flow.isComplete, voice.isListening, voice.isProcessing, prompt.isSpeaking])

  const submitDraft = useCallback(() => {
    if (!flow.currentQuestion) return
    flow.answer(draft)
  }, [draft, flow])

  const autoCommit = useCallback((v: unknown) => {
    setDraft(v)
    flow.answer(v)
  }, [flow])

  const canSubmitDraft = useMemo(() => {
    const q = flow.currentQuestion
    if (!q) return false
    if (q.optional) return true
    return isDraftValid(q, draft)
  }, [flow.currentQuestion, draft])

  return {
    flow,
    draft, setDraft, autoCommit, submitDraft, canSubmitDraft,
    prompt, voice,
    voiceSession, startVoiceSession, stopVoiceSession,
  }
}

const FALLBACK_QUESTION: GuidedQuestion = {
  id: '__none__', category: 'type', prompt: '', shortLabel: '', kind: 'text', isVisible: () => false,
}

function isDraftValid(q: GuidedQuestion, draft: unknown): boolean {
  switch (q.kind) {
    case 'choice':     return typeof draft === 'string' && draft.length > 0
    case 'boolean':    return typeof draft === 'boolean'
    case 'passengers': return typeof draft === 'number' && draft >= 1
    case 'groups':     return Array.isArray(draft) && draft.length > 0
    case 'address':    return (typeof draft === 'string' && draft.trim().length >= 5)
                          || (!!draft && typeof draft === 'object' && 'label' in draft)
    case 'text':       return typeof draft === 'string' && draft.trim().length > 0
    case 'phone':      return typeof draft === 'string' && draft.replace(/\D/g, '').length >= 10
    case 'date':       return typeof draft === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(draft)
    case 'time':       return typeof draft === 'string' && /^\d{1,2}:\d{2}$/.test(draft)
  }
}
