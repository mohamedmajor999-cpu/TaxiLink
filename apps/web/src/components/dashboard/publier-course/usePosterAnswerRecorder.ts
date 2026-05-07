'use client'

import { useCallback, useRef, useState } from 'react'
import { useAudioRecorder } from '@/hooks/useAudioRecorder'
import { parseVoiceAnswer, type VoiceAnswerResult } from '@/services/voiceAnswerService'
import type { Group } from '@taxilink/core'
import type { PosterMissingField } from './posterMissingFields'

interface Args {
  question:    PosterMissingField | null
  myGroups:    Group[]
  allFieldIds: string[]
  onResult:    (r: VoiceAnswerResult) => void
}

/**
 * Capture une réponse vocale à une question de relance du flow Poster, puis
 * délègue à `/api/missions/parse-voice-answer` (parser spécialisé qui sait
 * interpréter "trois" → 3 pour kind='passengers', "demain" → date ISO, etc.).
 *
 * À utiliser à la place du parser général (`parseVoiceAudio`) pour les
 * relances : sinon une réponse courte comme "3" sans contexte n'est pas
 * extraite correctement.
 */
export function usePosterAnswerRecorder({ question, myGroups, allFieldIds, onResult }: Args) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const questionRef = useRef(question)
  questionRef.current = question
  const groupsRef = useRef(myGroups)
  groupsRef.current = myGroups
  const idsRef = useRef(allFieldIds)
  idsRef.current = allFieldIds
  const onResultRef = useRef(onResult)
  onResultRef.current = onResult

  const handleAudio = useCallback(async (blob: Blob) => {
    const q = questionRef.current
    if (!q || blob.size === 0) return
    setIsProcessing(true)
    setError(null)
    try {
      const r = await parseVoiceAnswer(
        {
          questionId: q.id,
          kind: q.kind,
          prompt: q.prompt,
          options: q.options,
          availableGroups: q.kind === 'groups'
            ? groupsRef.current.map((g) => ({ id: g.id, name: g.name }))
            : undefined,
          allQuestionIds: idsRef.current,
        },
        blob,
      )
      onResultRef.current(r)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur IA')
    } finally {
      setIsProcessing(false)
    }
  }, [])

  const recorder = useAudioRecorder({ onStop: handleAudio, onError: () => {} })

  return {
    isSupported: recorder.isSupported,
    isListening: recorder.isRecording,
    isProcessing,
    error,
    start: () => { void recorder.start() },
    stop:  () => { recorder.stop() },
  }
}
