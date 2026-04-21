'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useVoiceDictation } from '@/hooks/useVoiceDictation'
import { smartAddressLookup } from './smartAddressLookup'
import type { AddressSuggestion } from '@/services/addressService'

interface Args {
  onResolved: (suggestion: AddressSuggestion) => void
  onFallbackText: (text: string) => void
}

/**
 * Dictée vocale ciblée sur un champ adresse unique.
 * - Enregistre une phrase (mode non continu).
 * - À la fin, tente un lookup multi-sources (BAN + Photon + Mapbox).
 * - Renseigne la suggestion si trouvée, sinon le texte brut.
 */
export function useAddressFieldVoice({ onResolved, onFallbackText }: Args) {
  const onResolvedRef = useRef(onResolved)
  const onFallbackRef = useRef(onFallbackText)
  onResolvedRef.current = onResolved
  onFallbackRef.current = onFallbackText

  const [isProcessing, setIsProcessing] = useState(false)
  const transcriptRef = useRef('')
  const shouldProcessRef = useRef(false)

  const voice = useVoiceDictation({
    lang: 'fr-FR',
    continuous: false,
    onFinalTranscript: (text) => {
      transcriptRef.current = transcriptRef.current
        ? `${transcriptRef.current} ${text}`
        : text
    },
  })

  useEffect(() => {
    if (voice.isListening || !shouldProcessRef.current) return
    shouldProcessRef.current = false
    const raw = transcriptRef.current.trim()
    transcriptRef.current = ''
    if (raw.length < 3) return
    setIsProcessing(true)
    smartAddressLookup(raw)
      .then((match) => {
        if (match) onResolvedRef.current(match)
        else onFallbackRef.current(raw)
      })
      .catch(() => onFallbackRef.current(raw))
      .finally(() => setIsProcessing(false))
  }, [voice.isListening])

  const start = useCallback(() => {
    transcriptRef.current = ''
    shouldProcessRef.current = true
    voice.start()
  }, [voice])

  const stop = useCallback(() => {
    voice.stop()
  }, [voice])

  return {
    isSupported: voice.isSupported,
    isListening: voice.isListening,
    isProcessing,
    error: voice.error,
    start,
    stop,
  }
}
