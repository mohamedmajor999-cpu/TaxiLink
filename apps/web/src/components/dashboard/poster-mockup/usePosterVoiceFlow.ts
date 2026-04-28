'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { useMissionVoiceFiller } from '@/components/dashboard/driver/useMissionVoiceFiller'
import { useGuidedVoicePrompt } from '@/components/dashboard/driver/guided/useGuidedVoicePrompt'
import type { MissionFormState } from '@/components/dashboard/driver/useMissionFormState'
import { getPosterMissingFields } from './posterMissingFields'

const MAX_RELANCES = 6
const SILENCE_AUTO_STOP_MS = 2500

export type PosterVoiceStatus = 'idle' | 'listening' | 'processing' | 'asking'

interface Args {
  filler: ReturnType<typeof useMissionVoiceFiller>
  form: MissionFormState
}

/**
 * Pilote le micro de la page « Poster une course » SANS changer d'écran :
 * dictée → parse Claude → si champs critiques manquants, TTS pose la question
 * et le micro se rouvre tout seul. Boucle jusqu'à MAX_RELANCES.
 */
export function usePosterVoiceFlow({ filler, form }: Args) {
  const tts = useGuidedVoicePrompt()
  const [status, setStatus] = useState<PosterVoiceStatus>('idle')
  const [relanceCount, setRelanceCount] = useState(0)
  const [lastQuestion, setLastQuestion] = useState<string | null>(null)

  const wasProcessingRef = useRef(false)
  const activeRef = useRef(false)
  const formRef = useRef(form)
  formRef.current = form

  const stop = useCallback(() => {
    activeRef.current = false
    tts.stop()
    filler.stop()
    setStatus('idle')
  }, [filler, tts])

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

    const missing = getPosterMissingFields(formRef.current, { parsedFields: filler.parsedFields })
    if (missing.length === 0 || relanceCount >= MAX_RELANCES) {
      activeRef.current = false
      setStatus('idle')
      return
    }

    const question = missing[0].prompt
    setLastQuestion(question)
    setRelanceCount((c) => c + 1)
    setStatus('asking')
    tts.speak(question).then(() => {
      if (!activeRef.current) return
      filler.start()
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filler.isListening, filler.isProcessing, filler.error])

  useEffect(() => {
    if (!activeRef.current || !filler.isListening) return
    if (filler.interimTranscript) return
    if (!filler.transcript.trim()) return
    const id = setTimeout(() => filler.stop(), SILENCE_AUTO_STOP_MS)
    return () => clearTimeout(id)
  }, [filler.isListening, filler.interimTranscript, filler.transcript, filler])

  const start = useCallback(() => {
    activeRef.current = true
    wasProcessingRef.current = false
    filler.resetParsedFields()
    setRelanceCount(0)
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
    relanceCount,
    maxRelances: MAX_RELANCES,
    start, stop, toggle,
  }
}
