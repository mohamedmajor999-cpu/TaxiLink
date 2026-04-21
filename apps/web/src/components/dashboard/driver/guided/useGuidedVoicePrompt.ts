'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

/**
 * Lit un texte via la synthèse vocale du navigateur (Web Speech Synthesis).
 * Sélectionne la voix française la plus naturelle disponible et ajuste
 * le débit pour un rendu moins robotique.
 */
export function useGuidedVoicePrompt() {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    setIsSupported(true)

    const loadVoices = () => setVoices(window.speechSynthesis.getVoices())
    loadVoices()
    window.speechSynthesis.onvoiceschanged = loadVoices

    return () => {
      window.speechSynthesis.cancel()
      window.speechSynthesis.onvoiceschanged = null
    }
  }, [])

  const selectedVoice = useMemo(() => pickBestFrenchVoice(voices), [voices])

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
        if (selectedVoice) utterance.voice = selectedVoice
        utterance.rate = 1.02
        utterance.pitch = 1.0
        utterance.volume = 1
        utterance.onend = () => { setIsSpeaking(false); resolve() }
        utterance.onerror = () => { setIsSpeaking(false); resolve() }
        utteranceRef.current = utterance
        setIsSpeaking(true)
        window.speechSynthesis.speak(utterance)
      })
    },
    [selectedVoice],
  )

  return { speak, stop, isSpeaking, isSupported, voiceName: selectedVoice?.name ?? null }
}

// Priorité : voix Google françaises premium > Microsoft Natural > Apple (Thomas/Amélie)
// > toute voix fr-FR > toute voix fr-*.
function pickBestFrenchVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null
  const fr = voices.filter((v) => v.lang.toLowerCase().startsWith('fr'))
  if (fr.length === 0) return null

  const preferred = [
    /google.*fran[çc]ais/i,
    /microsoft.*(denise|henri|paul|claude|julie).*(natural|online)/i,
    /microsoft.*(natural|online).*fr/i,
    /(thomas|amélie|amelie|audrey|marie|aurelie)/i,
    /google.*fr/i,
  ]
  for (const re of preferred) {
    const match = fr.find((v) => re.test(v.name))
    if (match) return match
  }
  return fr.find((v) => v.lang.toLowerCase() === 'fr-fr') ?? fr[0] ?? null
}
