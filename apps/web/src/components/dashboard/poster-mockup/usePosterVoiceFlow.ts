'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { useMissionVoiceFiller } from '@/components/dashboard/driver/useMissionVoiceFiller'
import { useGuidedVoicePrompt } from '@/components/dashboard/driver/guided/useGuidedVoicePrompt'
import type { MissionFormState } from '@/components/dashboard/driver/useMissionFormState'
import { getPosterMissingFields } from './posterMissingFields'

const MAX_ATTEMPTS = 3 // 1 + 2 relances

export type PosterVoiceStatus = 'idle' | 'listening' | 'processing' | 'asking'

interface Args {
  filler: ReturnType<typeof useMissionVoiceFiller>
  form: MissionFormState
}

/**
 * Pilote la dictée IN-PAGE de la page « Poster une course ».
 *
 * - Dictée initiale : continue, stop manuel uniquement (l'utilisateur clique
 *   « Arrêter »). Pas d'auto-stop sur silence (cause de coupure prématurée).
 * - Relances vocales : single-shot. La voix pose la question, le micro s'ouvre,
 *   on stoppe dès le premier final reçu (pas d'auto-restart Chrome → pas de
 *   doublons sur les relances).
 * - 3 tentatives max par champ (1 + 2 relances). Au-delà : champ skip, on passe.
 */
export function usePosterVoiceFlow({ filler, form }: Args) {
  const tts = useGuidedVoicePrompt()
  const [status, setStatus] = useState<PosterVoiceStatus>('idle')
  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(null)
  const [currentAttempt, setCurrentAttempt] = useState(0)
  const [lastQuestion, setLastQuestion] = useState<string | null>(null)

  const wasProcessingRef = useRef(false)
  const activeRef = useRef(false)
  const relanceModeRef = useRef(false)
  const baseTranscriptLenRef = useRef(0)
  const skippedRef = useRef<Set<string>>(new Set())
  const attemptsRef = useRef<Map<string, number>>(new Map())
  const formRef = useRef(form)
  formRef.current = form

  const stop = useCallback(() => {
    activeRef.current = false
    relanceModeRef.current = false
    tts.stop()
    filler.stop()
    setStatus('idle')
  }, [filler, tts])

  const askNext = useCallback(() => {
    const all = getPosterMissingFields(formRef.current, { parsedFields: filler.parsedFields })
    const next = all.find((m) => !skippedRef.current.has(m.id))
    if (!next) {
      activeRef.current = false
      relanceModeRef.current = false
      setCurrentQuestionId(null)
      setStatus('idle')
      return
    }

    const attempts = (attemptsRef.current.get(next.id) ?? 0) + 1
    if (attempts > MAX_ATTEMPTS) {
      skippedRef.current.add(next.id)
      askNext()
      return
    }
    attemptsRef.current.set(next.id, attempts)

    const prompt = attempts === 1
      ? next.prompt
      : `Je n’ai pas bien compris. ${next.prompt}`
    setCurrentQuestionId(next.id)
    setCurrentAttempt(attempts)
    setLastQuestion(prompt)
    setStatus('asking')

    tts.speak(prompt).then(() => {
      if (!activeRef.current) return
      relanceModeRef.current = true
      baseTranscriptLenRef.current = filler.transcript.length
      filler.start()
    })
  }, [filler, tts])

  // Réagit aux transitions du filler (parse en cours / terminé / erreur).
  useEffect(() => {
    if (!activeRef.current) return
    if (filler.error) { activeRef.current = false; setStatus('idle'); return }
    if (filler.isListening) { setStatus('listening'); return }
    if (filler.isProcessing) {
      wasProcessingRef.current = true
      setStatus('processing')
      return
    }
    if (!wasProcessingRef.current) return
    wasProcessingRef.current = false
    askNext()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filler.isListening, filler.isProcessing, filler.error])

  // En mode relance : stoppe le micro dès le 1er final reçu (single-shot, pas
  // d'auto-restart, pas de doublons).
  useEffect(() => {
    if (!relanceModeRef.current || !filler.isListening) return
    if (filler.transcript.length > baseTranscriptLenRef.current && filler.transcript.trim()) {
      relanceModeRef.current = false
      filler.stop()
    }
  }, [filler.isListening, filler.transcript, filler])

  const start = useCallback(() => {
    activeRef.current = true
    relanceModeRef.current = false
    wasProcessingRef.current = false
    baseTranscriptLenRef.current = 0
    skippedRef.current = new Set()
    attemptsRef.current = new Map()
    filler.resetParsedFields()
    setCurrentQuestionId(null)
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
    error: filler.error,
    lastQuestion,
    currentQuestionId,
    currentAttempt,
    maxAttempts: MAX_ATTEMPTS,
    start, stop, toggle,
  }
}
