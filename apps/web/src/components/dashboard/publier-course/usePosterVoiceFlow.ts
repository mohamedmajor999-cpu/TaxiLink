'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { useMissionVoiceFiller } from '@/components/dashboard/driver/useMissionVoiceFiller'
import { useGuidedVoicePrompt } from '@/components/dashboard/driver/guided/useGuidedVoicePrompt'
import type { MissionFormState } from '@/components/dashboard/driver/useMissionFormState'
import type { Group } from '@taxilink/core'
import type { VoiceAnswerResult } from '@/services/voiceAnswerService'
import { getPosterMissingFields, type PosterMissingField } from './posterMissingFields'
import { applyPosterAnswer } from './posterAnswerApplier'
import { usePosterAnswerRecorder } from './usePosterAnswerRecorder'

const MAX_ATTEMPTS = 3 // 1 + 2 relances
const ALL_FIELD_IDS = ['type','departure','destination','date','time','phone','medicalMotif','returnTrip','passengers','groupIds']

export type PosterVoiceStatus = 'idle' | 'listening' | 'processing' | 'asking'

interface Coords { lat: number; lng: number }

interface Args {
  filler: ReturnType<typeof useMissionVoiceFiller>
  form: MissionFormState
  myGroups: Group[]
  setDepartureCoords: (c: Coords | null) => void
  setDestinationCoords: (c: Coords | null) => void
}

/**
 * Pilote la dictée IN-PAGE de la page « Poster une course ».
 *
 * - Première frappe micro : `filler` (parser GÉNÉRAL `/api/missions/parse-voice`)
 *   qui extrait tous les champs d'une dictée libre.
 * - Relances de questions manquantes : `answerRecorder` (parser SPÉCIALISÉ
 *   `/api/missions/parse-voice-answer`) qui sait interpréter une réponse courte
 *   comme "trois" → passengers=3 ou "demain" → date ISO. Sans ça les réponses
 *   courtes étaient ignorées (parser général ne tirait rien d'une dictée
 *   d'un mot sans contexte).
 *
 * 3 tentatives max par champ (1 + 2 relances). Au-delà : champ skip, on passe.
 */
export function usePosterVoiceFlow({ filler, form, myGroups, setDepartureCoords, setDestinationCoords }: Args) {
  const tts = useGuidedVoicePrompt()
  const [status, setStatus] = useState<PosterVoiceStatus>('idle')
  const [currentQuestion, setCurrentQuestion] = useState<PosterMissingField | null>(null)
  const [currentAttempt, setCurrentAttempt] = useState(0)
  const [lastQuestion, setLastQuestion] = useState<string | null>(null)

  const wasProcessingRef = useRef(false)
  const activeRef = useRef(false)
  const skippedRef = useRef<Set<string>>(new Set())
  const answeredRef = useRef<Set<string>>(new Set())
  const attemptsRef = useRef<Map<string, number>>(new Map())
  const formRef = useRef(form)
  formRef.current = form

  const askNextRef = useRef<() => void>(() => {})

  const onAnswerResult = useCallback(async (r: VoiceAnswerResult) => {
    const q = currentQuestion
    if (!q) { askNextRef.current(); return }
    if (r.intent === 'answer') {
      const ok = await applyPosterAnswer(q.id, r.value, { form: formRef.current, setDepartureCoords, setDestinationCoords })
      if (ok) answeredRef.current.add(q.id)
    } else if (r.intent === 'skip') {
      skippedRef.current.add(q.id)
    }
    askNextRef.current()
  }, [currentQuestion, setDepartureCoords, setDestinationCoords])

  const answerRecorder = usePosterAnswerRecorder({
    question: currentQuestion,
    myGroups,
    allFieldIds: ALL_FIELD_IDS,
    onResult: onAnswerResult,
  })

  const stop = useCallback(() => {
    activeRef.current = false
    tts.stop()
    filler.stop()
    answerRecorder.stop()
    setStatus('idle')
  }, [filler, tts, answerRecorder])

  const askNext = useCallback(() => {
    const merged = new Set<string>()
    filler.parsedFields.forEach((id) => merged.add(id))
    answeredRef.current.forEach((id) => merged.add(id))
    const all = getPosterMissingFields(formRef.current, { parsedFields: merged })
    const next = all.find((m) => !skippedRef.current.has(m.id))
    if (!next) {
      activeRef.current = false
      setCurrentQuestion(null)
      setStatus('idle')
      return
    }
    const attempts = (attemptsRef.current.get(next.id) ?? 0) + 1
    if (attempts > MAX_ATTEMPTS) {
      skippedRef.current.add(next.id)
      askNextRef.current()
      return
    }
    attemptsRef.current.set(next.id, attempts)
    const prompt = attempts === 1 ? next.prompt : `Je n’ai pas bien compris. ${next.prompt}`
    setCurrentQuestion(next)
    setCurrentAttempt(attempts)
    setLastQuestion(prompt)
    setStatus('asking')
    tts.speak(prompt).then(() => {
      if (!activeRef.current) return
      answerRecorder.start()
    })
  }, [filler.parsedFields, tts, answerRecorder])
  askNextRef.current = askNext

  // Réagit au filler (dictée initiale uniquement).
  useEffect(() => {
    if (!activeRef.current) return
    if (filler.error) { activeRef.current = false; setStatus('idle'); return }
    if (filler.isListening) { setStatus('listening'); return }
    if (filler.isProcessing) { wasProcessingRef.current = true; setStatus('processing'); return }
    if (!wasProcessingRef.current) return
    wasProcessingRef.current = false
    askNextRef.current()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filler.isListening, filler.isProcessing, filler.error])

  // Réagit au recorder de relance (réponses aux questions).
  useEffect(() => {
    if (!activeRef.current) return
    if (answerRecorder.isListening)  setStatus('listening')
    else if (answerRecorder.isProcessing) setStatus('processing')
  }, [answerRecorder.isListening, answerRecorder.isProcessing])

  const start = useCallback(() => {
    activeRef.current = true
    wasProcessingRef.current = false
    skippedRef.current = new Set()
    answeredRef.current = new Set()
    attemptsRef.current = new Map()
    filler.resetParsedFields()
    setCurrentQuestion(null)
    setCurrentAttempt(0)
    setLastQuestion(null)
    setStatus('listening')
    filler.start()
  }, [filler])

  const toggle = useCallback(() => {
    if (activeRef.current) stop()
    else start()
  }, [start, stop])

  return {
    isSupported: filler.isSupported && tts.isSupported,
    status,
    isActive: status !== 'idle',
    isSpeaking: tts.isSpeaking,
    interimTranscript: filler.interimTranscript,
    transcript: filler.transcript,
    error: filler.error ?? answerRecorder.error,
    lastQuestion,
    currentQuestionId: currentQuestion?.id ?? null,
    currentAttempt,
    maxAttempts: MAX_ATTEMPTS,
    start, stop, toggle,
  }
}
