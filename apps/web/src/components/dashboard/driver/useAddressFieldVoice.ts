'use client'

import { useCallback, useRef, useState } from 'react'
import { useAudioRecorder } from '@/hooks/useAudioRecorder'
import { transcribeAudioBlob } from '@/services/transcribeService'
import { smartAddressLookup } from './smartAddressLookup'
import type { AddressSuggestion } from '@/services/addressService'

interface Args {
  onResolved: (suggestion: AddressSuggestion) => void
  onFallbackText: (text: string) => void
}

/**
 * Dictée vocale ciblée sur un champ adresse unique.
 * - Enregistre une phrase (audio).
 * - Whisper transcrit, puis lookup multi-sources (BAN + Photon + Mapbox).
 * - Renseigne la suggestion si trouvée, sinon le texte brut.
 */
export function useAddressFieldVoice({ onResolved, onFallbackText }: Args) {
  const onResolvedRef = useRef(onResolved)
  const onFallbackRef = useRef(onFallbackText)
  onResolvedRef.current = onResolved
  onFallbackRef.current = onFallbackText

  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAudio = useCallback(async (blob: Blob) => {
    if (blob.size === 0) return
    setIsProcessing(true)
    setError(null)
    try {
      const { text } = await transcribeAudioBlob(blob)
      const raw = text.trim()
      if (raw.length < 3) return
      const match = await smartAddressLookup(raw).catch(() => null)
      if (match) onResolvedRef.current(match)
      else onFallbackRef.current(raw)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur transcription')
    } finally {
      setIsProcessing(false)
    }
  }, [])

  const recorder = useAudioRecorder({
    onStop: handleAudio,
    onError: (code) => setError(code),
  })

  const start = useCallback(() => {
    setError(null)
    void recorder.start()
  }, [recorder])

  const stop = useCallback(() => { recorder.stop() }, [recorder])

  return {
    isSupported: recorder.isSupported,
    isListening: recorder.isRecording,
    isProcessing,
    error,
    start,
    stop,
  }
}
