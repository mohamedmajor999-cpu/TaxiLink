'use client'

import { useEffect, useRef, useState } from 'react'

interface Options {
  qId: string | null
  promptText: string
  active: boolean
  autoSpeak: boolean
  speak: (text: string) => Promise<void>
  isSupported: boolean
}

/**
 * Lance la synthèse vocale pour chaque nouvelle question et expose l'id de
 * la question dont l'annonce est terminée.
 *
 * Fallback 6 s : certains Chrome/Edge n'émettent pas `onend` de manière fiable
 * (voix non chargée, onglet en second plan), on débloque le flux au pire.
 *
 * Refs pour `speak` / `isSupported` : le parent recrée ces valeurs à chaque
 * render (selectedVoice chargée de façon async), ce qui effacerait le
 * `setTimeout` via le cleanup avant qu'il ne déclenche. On isole l'effet
 * sur `qId` + `active` + `autoSpeak` uniquement.
 */
export function useGuidedTtsAnnouncer({
  qId, promptText, active, autoSpeak, speak, isSupported,
}: Options): string | null {
  const [announcedId, setAnnouncedId] = useState<string | null>(null)
  const spokenIdRef = useRef<string | null>(null)
  const speakRef = useRef(speak)
  speakRef.current = speak
  const supportedRef = useRef(isSupported)
  supportedRef.current = isSupported
  const textRef = useRef(promptText)
  textRef.current = promptText

  useEffect(() => {
    if (!active) {
      spokenIdRef.current = null
      setAnnouncedId(null)
      return
    }
    if (!qId || spokenIdRef.current === qId) return
    spokenIdRef.current = qId
    if (!autoSpeak || !supportedRef.current) {
      setAnnouncedId(qId)
      return
    }
    setAnnouncedId(null)
    let cancelled = false
    const fallback = setTimeout(() => { if (!cancelled) setAnnouncedId(qId) }, 6000)
    speakRef.current(textRef.current).then(() => {
      if (cancelled) return
      clearTimeout(fallback)
      setAnnouncedId(qId)
    })
    return () => { cancelled = true; clearTimeout(fallback) }
  }, [qId, active, autoSpeak])

  return announcedId
}
