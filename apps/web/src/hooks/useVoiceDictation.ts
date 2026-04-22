'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  getSpeechRecognitionCtor,
  type SpeechRecognitionInstance,
} from '@/lib/speechRecognition'

/**
 * Hook générique de dictée vocale via Web Speech API.
 * Compatibilité : Chrome, Edge, Safari récents (préfixe webkit). Firefox = non supporté.
 */

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

export function useVoiceDictation(options: Options): UseVoiceDictation {
  const { lang = 'fr-FR', onFinalTranscript, continuous = false } = options
  const onFinalRef = useRef(onFinalTranscript)
  onFinalRef.current = onFinalTranscript

  const [isSupported] = useState<boolean>(() => getSpeechRecognitionCtor() !== null)
  const [isListening, setIsListening] = useState(false)
  const [interimTranscript, setInterimTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  // Chrome coupe la reconnaissance après ~5-10s de silence même avec continuous=true.
  // On auto-restart tant que l'utilisateur n'a pas explicitement appelé stop().
  const wantListeningRef = useRef(false)
  const restartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Après auto-restart, Chrome peut ré-émettre le dernier final de la session
  // précédente. On déduplique le texte identique sur une courte fenêtre.
  const lastFinalRef = useRef<{ text: string; at: number } | null>(null)

  useEffect(() => {
    const Ctor = getSpeechRecognitionCtor()
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
          if (!trimmed) continue
          const now = Date.now()
          const last = lastFinalRef.current
          if (last && last.text === trimmed && now - last.at < 3000) continue
          lastFinalRef.current = { text: trimmed, at: now }
          onFinalRef.current(trimmed)
        } else {
          interim += text
        }
      }
      setInterimTranscript(interim)
    }
    instance.onerror = (e) => {
      // 'no-speech' pendant une session voulue : silence passager, on laisse onend relancer.
      if (e.error === 'no-speech' && wantListeningRef.current) return
      wantListeningRef.current = false
      setError(e.error || 'unknown')
      setIsListening(false)
      setInterimTranscript('')
    }
    instance.onend = () => {
      setInterimTranscript('')
      // Auto-restart uniquement en mode continu (session longue). En mode ponctuel,
      // on laisse la reconnaissance s'arrêter naturellement après la phrase.
      if (continuous && wantListeningRef.current) {
        if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current)
        restartTimeoutRef.current = setTimeout(() => {
          if (!wantListeningRef.current) return
          try { instance.start() } catch { /* déjà relancé ou invalid state : ignore */ }
        }, 150)
        return
      }
      wantListeningRef.current = false
      setIsListening(false)
    }
    instance.onstart = () => {
      setError(null)
      setIsListening(true)
    }

    recognitionRef.current = instance
    return () => {
      wantListeningRef.current = false
      if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current)
      try { instance.abort() } catch { /* noop */ }
      recognitionRef.current = null
    }
  }, [lang, continuous])

  const start = useCallback(() => {
    const r = recognitionRef.current
    if (!r || isListening) return
    wantListeningRef.current = true
    lastFinalRef.current = null
    try { r.start() } catch { /* déjà démarré : ignore */ }
  }, [isListening])

  const stop = useCallback(() => {
    const r = recognitionRef.current
    if (!r) return
    wantListeningRef.current = false
    if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current)
    try { r.stop() } catch { /* noop */ }
  }, [])

  return { isSupported, isListening, interimTranscript, start, stop, error }
}
