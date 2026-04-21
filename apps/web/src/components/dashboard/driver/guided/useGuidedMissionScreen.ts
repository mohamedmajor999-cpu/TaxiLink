'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Group } from '@taxilink/core'
import type { MissionFormState } from '../useMissionFormState'
import { FALLBACK_QUESTION, isDraftValid } from './guidedDraftValidation'
import { initialValueForQuestion } from './guidedInitialValue'
import { playBeep } from './playBeep'
import { useGuidedAnswerApplier, type GuidedSetters } from './useGuidedAnswerApplier'
import { useGuidedMissionFlow } from './useGuidedMissionFlow'
import { useGuidedVoiceAnswer } from './useGuidedVoiceAnswer'
import { useGuidedVoicePrompt } from './useGuidedVoicePrompt'

interface Options {
  form: MissionFormState
  myGroups: Group[]
  setters: GuidedSetters
  allQuestionIds: string[]
  voiceAutoSpeak: boolean
  onComplete?: () => void
}

/**
 * État et handlers de l'écran du flux guidé : pilote la liste de questions,
 * le brouillon de la question courante, la lecture vocale et la dictée.
 */
export function useGuidedMissionScreen(opts: Options) {
  const { form, myGroups, setters, allQuestionIds, voiceAutoSpeak, onComplete } = opts

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
  // `announcedId` = id de la question dont l'annonce TTS est terminée.
  // Le bip d'écoute + ouverture micro attendent ce marqueur pour ne pas
  // bipper AVANT que la voix ait fini de parler.
  const [announcedId, setAnnouncedId] = useState<string | null>(null)

  const voice = useGuidedVoiceAnswer({
    question: flow.currentQuestion ?? FALLBACK_QUESTION,
    allQuestionIds,
    onResult: flow.handleVoiceResult,
  })

  // Session vocale : un clic sur le micro active une session qui auto-relance
  // le micro après chaque TTS jusqu'à la fin du flux ou arrêt manuel.
  const [voiceSession, setVoiceSession] = useState(false)

  // Le TTS ne se déclenche qu'une fois la session démarrée par l'utilisateur,
  // pour éviter la lecture automatique dès l'arrivée sur la page. On attend
  // la fin de la promesse `speak()` avant de marquer la question "annoncée".
  useEffect(() => {
    if (!voiceSession) {
      spokenIdRef.current = null
      setAnnouncedId(null)
      return
    }
    const q = flow.currentQuestion
    if (!q || spokenIdRef.current === q.id) return
    spokenIdRef.current = q.id
    if (!voiceAutoSpeak || !prompt.isSupported) {
      setAnnouncedId(q.id)
      return
    }
    setAnnouncedId(null)
    let cancelled = false
    prompt.speak(q.prompt).then(() => {
      if (!cancelled) setAnnouncedId(q.id)
    })
    return () => { cancelled = true }
  }, [flow.currentQuestion, prompt, voiceAutoSpeak, voiceSession])
  const voiceStartRef = useRef(voice.start)
  voiceStartRef.current = voice.start
  const voiceStopRef = useRef(voice.stop)
  voiceStopRef.current = voice.stop
  const promptStopRef = useRef(prompt.stop)
  promptStopRef.current = prompt.stop

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
    if (flow.isComplete) {
      setVoiceSession(false)
      voiceStopRef.current()
      promptStopRef.current()
      return
    }
    const q = flow.currentQuestion
    if (!q || announcedId !== q.id) return
    if (voice.isListening || voice.isProcessing || prompt.isSpeaking) return
    // Bip court (≈180 ms) APRÈS la fin du TTS puis ouverture du micro.
    let cancelled = false
    playBeep().then(() => {
      if (cancelled) return
      voiceStartRef.current()
    })
    return () => { cancelled = true }
  }, [voiceSession, announcedId, flow.currentQuestion, flow.isComplete, voice.isListening, voice.isProcessing, prompt.isSpeaking])

  const submitDraft = useCallback(async () => {
    if (!flow.currentQuestion) return
    await flow.answer(draft)
  }, [draft, flow])

  const autoCommit = useCallback(async (v: unknown) => {
    setDraft(v)
    await flow.answer(v)
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

