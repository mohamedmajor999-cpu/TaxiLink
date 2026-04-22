'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { useMissionVoiceFiller } from '../useMissionVoiceFiller'
import { useGuidedVoicePrompt } from '../guided/useGuidedVoicePrompt'
import { getMissingCriticalFields, type VocalFormSnapshot } from './missingCriticalFields'

const MAX_RELANCES = 3

export type VocalFlowStatus = 'idle' | 'listening' | 'processing' | 'asking' | 'complete'

interface Args {
  filler: ReturnType<typeof useMissionVoiceFiller>
  snapshot: () => VocalFormSnapshot
  onComplete: () => void
}

/**
 * Orchestre le mode « Mains libres » : écoute, parse (Claude Haiku), relance
 * vocale sur les champs critiques manquants, jusqu'à MAX_RELANCES puis aperçu.
 */
export function useVoiceFreeFlow({ filler, snapshot, onComplete }: Args) {
  const tts = useGuidedVoicePrompt()
  const [status, setStatus] = useState<VocalFlowStatus>('idle')
  const [relanceCount, setRelanceCount] = useState(0)
  const [lastQuestion, setLastQuestion] = useState<string | null>(null)

  const wasProcessingRef = useRef(false)
  const completedRef = useRef(false)
  const activeRef = useRef(false)
  const snapshotRef = useRef(snapshot)
  snapshotRef.current = snapshot
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    if (!activeRef.current) return
    if (filler.error) { setStatus('idle'); return }
    if (filler.isListening) { setStatus('listening'); return }
    if (filler.isProcessing) { wasProcessingRef.current = true; setStatus('processing'); return }
    if (!wasProcessingRef.current) return
    wasProcessingRef.current = false

    const missing = getMissingCriticalFields(snapshotRef.current())
    if (missing.length === 0 || relanceCount >= MAX_RELANCES) {
      finalize()
      return
    }

    const question = missing[0].prompt
    setLastQuestion(question)
    setRelanceCount((c) => c + 1)
    setStatus('asking')
    tts.speak(question).then(() => {
      if (!activeRef.current || completedRef.current) return
      filler.start()
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filler.isListening, filler.isProcessing, filler.error])

  const finalize = useCallback(() => {
    if (completedRef.current) return
    completedRef.current = true
    activeRef.current = false
    setStatus('complete')
    onCompleteRef.current()
  }, [])

  const start = useCallback(() => {
    completedRef.current = false
    activeRef.current = true
    wasProcessingRef.current = false
    setRelanceCount(0)
    setLastQuestion(null)
    setStatus('listening')
    filler.start()
  }, [filler])

  const stop = useCallback(() => {
    activeRef.current = false
    tts.stop()
    filler.stop()
    setStatus('idle')
  }, [filler, tts])

  const skipToPreview = useCallback(() => {
    tts.stop()
    filler.stop()
    finalize()
  }, [filler, tts, finalize])

  return {
    isSupported: filler.isSupported && tts.isSupported,
    status,
    isListening: filler.isListening,
    isProcessing: filler.isProcessing,
    isSpeaking: tts.isSpeaking,
    transcript: filler.transcript,
    interimTranscript: filler.interimTranscript,
    error: filler.error,
    lastQuestion,
    relanceCount,
    maxRelances: MAX_RELANCES,
    start, stop, skipToPreview,
  }
}
