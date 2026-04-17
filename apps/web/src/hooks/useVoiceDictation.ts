'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Hook générique de dictée vocale via Web Speech API.
 * Aucune dépendance externe : types SpeechRecognition déclarés localement.
 * Compatibilité : Chrome, Edge, Safari récents (préfixe webkit). Firefox = non supporté.
 */

interface SpeechRecognitionAlternative {
  transcript: string
}
interface SpeechRecognitionResult {
  0: SpeechRecognitionAlternative
  isFinal: boolean
}
interface SpeechRecognitionResultList {
  length: number
  [index: number]: SpeechRecognitionResult
}
interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList
  resultIndex: number
}
interface SpeechRecognitionErrorEvent {
  error: string
}
interface SpeechRecognitionInstance {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((e: SpeechRecognitionEvent) => void) | null
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  onstart: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}
type SpeechRecognitionCtor = new () => SpeechRecognitionInstance

interface Options {
  lang?: string
  onFinalTranscript: (text: string) => void
  continuous?: boolean
}

interface UseVoiceDictation {
  isSupported: boolean
  isListening: boolean
  interimTranscript: string
  start: () => void
  stop: () => void
  error: string | null
}

function getCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export function useVoiceDictation(options: Options): UseVoiceDictation {
  const { lang = 'fr-FR', onFinalTranscript, continuous = false } = options
  const onFinalRef = useRef(onFinalTranscript)
  onFinalRef.current = onFinalTranscript

  const [isSupported] = useState<boolean>(() => getCtor() !== null)
  const [isListening, setIsListening] = useState(false)
  const [interimTranscript, setInterimTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)

  useEffect(() => {
    const Ctor = getCtor()
    if (!Ctor) return
    const instance = new Ctor()
    instance.lang = lang
    instance.continuous = continuous
    instance.interimResults = true

    instance.onresult = (e) => {
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i]
        const text = result[0].transcript
        if (result.isFinal) {
          const trimmed = text.trim()
          if (trimmed) onFinalRef.current(trimmed)
        } else {
          interim += text
        }
      }
      setInterimTranscript(interim)
    }
    instance.onerror = (e) => {
      setError(e.error || 'unknown')
      setIsListening(false)
      setInterimTranscript('')
    }
    instance.onend = () => {
      setIsListening(false)
      setInterimTranscript('')
    }
    instance.onstart = () => {
      setError(null)
      setIsListening(true)
    }

    recognitionRef.current = instance
    return () => {
      try { instance.abort() } catch { /* noop */ }
      recognitionRef.current = null
    }
  }, [lang, continuous])

  const start = useCallback(() => {
    const r = recognitionRef.current
    if (!r || isListening) return
    try { r.start() } catch { /* déjà démarré : ignore */ }
  }, [isListening])

  const stop = useCallback(() => {
    const r = recognitionRef.current
    if (!r || !isListening) return
    try { r.stop() } catch { /* noop */ }
  }, [isListening])

  return { isSupported, isListening, interimTranscript, start, stop, error }
}
