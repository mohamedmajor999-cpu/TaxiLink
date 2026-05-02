'use client'

import { useCallback, useRef, useState } from 'react'
import type { Group } from '@taxilink/core'
import { useAudioRecorder } from '@/hooks/useAudioRecorder'
import { parseVoiceAnswer, type VoiceAnswerResult } from '@/services/voiceAnswerService'
import type { GuidedQuestion } from './guidedTypes'

const MIC_ERRORS: Record<string, string> = {
  'not-allowed': 'Accès micro refusé.',
  'unsupported': 'Micro non supporté par ce navigateur.',
  'record-error': 'Erreur d’enregistrement.',
}

interface Options {
  question: GuidedQuestion
  allQuestionIds: string[]
  myGroups: Group[]
  onResult: (result: VoiceAnswerResult) => void
}

/**
 * Capture une réponse vocale à la question courante via MediaRecorder, puis
 * délègue transcription + parsing à /api/missions/parse-voice-answer (Whisper
 * + GPT-4o-mini).
 */
export function useGuidedVoiceAnswer({ question, allQuestionIds, myGroups, onResult }: Options) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const [recorderError, setRecorderError] = useState<string | null>(null)
  const onResultRef = useRef(onResult)
  onResultRef.current = onResult
  const questionRef = useRef(question)
  questionRef.current = question
  const idsRef = useRef(allQuestionIds)
  idsRef.current = allQuestionIds
  const groupsRef = useRef(myGroups)
  groupsRef.current = myGroups

  const handleAudio = useCallback(async (blob: Blob) => {
    if (blob.size === 0) return
    setIsProcessing(true)
    setParseError(null)
    try {
      const q = questionRef.current
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
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Erreur IA')
    } finally {
      setIsProcessing(false)
    }
  }, [])

  const recorder = useAudioRecorder({
    onStop: handleAudio,
    onError: (code) => setRecorderError(code),
  })

  const start = useCallback(() => {
    setParseError(null)
    setRecorderError(null)
    void recorder.start()
  }, [recorder])

  const stop = useCallback(() => { recorder.stop() }, [recorder])

  const micError = recorderError ? (MIC_ERRORS[recorderError] ?? `Erreur micro (${recorderError})`) : null

  return {
    isSupported: recorder.isSupported,
    isListening: recorder.isRecording,
    isProcessing,
    interimTranscript: '',
    error: micError ?? parseError,
    start, stop,
  }
}
