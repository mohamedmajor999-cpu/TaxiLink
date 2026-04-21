'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Group } from '@taxilink/core'
import { useVoiceDictation } from '@/hooks/useVoiceDictation'
import { parseVoiceAnswer, type VoiceAnswerResult } from '@/services/voiceAnswerService'
import type { GuidedQuestion } from './guidedTypes'

const MIC_ERRORS: Record<string, string> = {
  'no-speech': 'Aucune voix détectée.',
  'audio-capture': 'Micro indisponible.',
  'not-allowed': 'Accès micro refusé.',
  'service-not-allowed': 'Accès micro refusé.',
  'network': 'Pas de réseau.',
  'aborted': 'Dictée interrompue.',
}

interface Options {
  question: GuidedQuestion
  allQuestionIds: string[]
  myGroups: Group[]
  onResult: (result: VoiceAnswerResult) => void
}

/**
 * Capture une réponse vocale à la question courante, puis délègue le parsing
 * (intent + valeur) à Claude Haiku via /api/missions/parse-voice-answer.
 */
export function useGuidedVoiceAnswer({ question, allQuestionIds, myGroups, onResult }: Options) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const transcriptRef = useRef('')
  const onResultRef = useRef(onResult)
  onResultRef.current = onResult

  const voice = useVoiceDictation({
    lang: 'fr-FR',
    continuous: false,
    onFinalTranscript: (text) => {
      transcriptRef.current = transcriptRef.current ? `${transcriptRef.current} ${text}` : text
    },
  })

  useEffect(() => {
    if (voice.isListening) return
    const full = transcriptRef.current.trim()
    if (!full) return
    transcriptRef.current = ''
    setIsProcessing(true)
    setParseError(null)
    parseVoiceAnswer({
      questionId: question.id,
      kind: question.kind,
      prompt: question.prompt,
      options: question.options,
      availableGroups: question.kind === 'groups'
        ? myGroups.map((g) => ({ id: g.id, name: g.name }))
        : undefined,
      allQuestionIds,
      transcript: full,
    })
      .then((r) => onResultRef.current(r))
      .catch((err) => setParseError(err instanceof Error ? err.message : 'Erreur IA'))
      .finally(() => setIsProcessing(false))
  }, [voice.isListening, question, allQuestionIds, myGroups])

  const start = useCallback(() => {
    transcriptRef.current = ''
    setParseError(null)
    voice.start()
  }, [voice])

  const stop = useCallback(() => { voice.stop() }, [voice])

  const micError = voice.error ? (MIC_ERRORS[voice.error] ?? `Erreur micro (${voice.error})`) : null

  return {
    isSupported: voice.isSupported,
    isListening: voice.isListening,
    isProcessing,
    interimTranscript: voice.interimTranscript,
    error: micError ?? parseError,
    start, stop,
  }
}
