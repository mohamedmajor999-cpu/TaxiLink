'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Lit un texte via la synthèse vocale du navigateur (Web Speech Synthesis).
 * Utilisé pour annoncer chaque question du flux guidé.
 */
export function useGuidedVoicePrompt() {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  useEffect(() => {
    setIsSupported(typeof window !== 'undefined' && 'speechSynthesis' in window)
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const stop = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
  }, [])

  const speak = useCallback(
    (text: string): Promise<void> => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return Promise.resolve()
      window.speechSynthesis.cancel()
      return new Promise((resolve) => {
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = 'fr-FR'
        utterance.rate = 1
        utterance.pitch = 1
        utterance.onend = () => { setIsSpeaking(false); resolve() }
        utterance.onerror = () => { setIsSpeaking(false); resolve() }
        utteranceRef.current = utterance
        setIsSpeaking(true)
        window.speechSynthesis.speak(utterance)
      })
    },
    [],
  )

  return { speak, stop, isSpeaking, isSupported }
}
