'use client'

import { ArrowLeft, ArrowRight, Mic, MicOff, SkipForward, Volume2, VolumeX } from 'lucide-react'
import type { Group } from '@taxilink/core'
import type { MissionFormState } from '../useMissionFormState'
import { GuidedQuestionRenderer } from './GuidedQuestionRenderer'
import { CATEGORY_LABELS } from './guidedTypes'
import { GUIDED_QUESTIONS } from './guidedQuestions'
import type { GuidedSetters } from './useGuidedAnswerApplier'
import { useGuidedMissionScreen } from './useGuidedMissionScreen'
import { useState } from 'react'

interface Props {
  form: MissionFormState
  myGroups: Group[]
  setters: GuidedSetters
  onComplete: () => void
}

const ALL_IDS = GUIDED_QUESTIONS.map((q) => q.id)

export function GuidedMissionFlow({ form, myGroups, setters, onComplete }: Props) {
  const [voiceAutoSpeak, setVoiceAutoSpeak] = useState(true)
  const s = useGuidedMissionScreen({
    form, myGroups, setters, allQuestionIds: ALL_IDS, onComplete, voiceAutoSpeak,
  })

  const q = s.flow.currentQuestion
  if (!q) return null

  const progressPct = s.flow.totalQuestions > 0
    ? Math.round(((s.flow.currentIndex + 1) / s.flow.totalQuestions) * 100)
    : 0

  const toggleMic = () => (s.voiceSession ? s.stopVoiceSession() : s.startVoiceSession())
  const toggleSpeak = () => {
    if (s.prompt.isSpeaking) s.prompt.stop()
    setVoiceAutoSpeak((v) => !v)
  }

  return (
    <div className="bg-paper pb-24 md:pb-6">
      <div className="px-4 md:px-8 pt-4 md:pt-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-warm-500">
          <span>{CATEGORY_LABELS[q.category]}</span>
          <span>{s.flow.currentIndex + 1} / {s.flow.totalQuestions}</span>
        </div>
        <div className="mt-2 h-1 rounded-full bg-warm-100 overflow-hidden">
          <div className="h-full bg-brand transition-all" style={{ width: `${progressPct}%` }} />
        </div>

        <div className="mt-6 flex items-start justify-between gap-3">
          <h2 className="text-[22px] font-bold text-ink leading-snug tracking-tight flex-1">
            {q.prompt}
          </h2>
          {s.prompt.isSupported && (
            <button
              type="button"
              onClick={toggleSpeak}
              aria-label={voiceAutoSpeak ? 'Couper la lecture vocale' : 'Activer la lecture vocale'}
              className="shrink-0 w-9 h-9 rounded-full border border-warm-200 text-warm-500 hover:bg-warm-50 flex items-center justify-center"
            >
              {voiceAutoSpeak ? <Volume2 className="w-4 h-4" strokeWidth={2} /> : <VolumeX className="w-4 h-4" strokeWidth={2} />}
            </button>
          )}
        </div>

        <div className="mt-4">
          <GuidedQuestionRenderer
            question={q}
            value={s.draft}
            myGroups={myGroups}
            onChange={s.setDraft}
            onAutoCommit={s.autoCommit}
            onEnterSubmit={s.submitDraft}
          />
        </div>

        {s.voice.isSupported && (
          <div className="mt-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleMic}
                aria-label={s.voiceSession ? 'Arrêter la session vocale' : 'Démarrer la session vocale'}
                className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                  s.voiceSession ? 'bg-brand text-ink' : 'bg-ink text-paper hover:bg-warm-800'
                }`}
              >
                {s.voice.isListening && <span className="absolute inset-0 rounded-full bg-brand/40 animate-ping" />}
                {s.voiceSession ? <MicOff className="relative w-5 h-5" strokeWidth={2} /> : <Mic className="relative w-5 h-5" strokeWidth={2} />}
              </button>
              <div className="flex-1 text-[13px] text-warm-600 leading-snug">
                {s.voice.isListening && (s.voice.interimTranscript || 'Parlez…')}
                {s.voice.isProcessing && !s.voice.isListening && 'Analyse en cours…'}
                {s.voiceSession && !s.voice.isListening && !s.voice.isProcessing && (s.prompt.isSpeaking ? 'Question en cours…' : 'Prêt pour la suite…')}
                {!s.voiceSession && (s.voice.error ?? 'Cliquez pour démarrer l’assistant vocal.')}
              </div>
            </div>
            {s.voiceSession && (
              <p className="mt-2 text-[11px] text-warm-400 leading-snug">
                Astuces : dites <span className="font-semibold">« retour »</span>, <span className="font-semibold">« passer »</span>, ou <span className="font-semibold">« corrige le nom »</span> pour naviguer.
              </p>
            )}
          </div>
        )}

        <div className="mt-6 flex items-center gap-2">
          <button
            type="button"
            onClick={s.flow.back}
            disabled={s.flow.currentIndex <= 0}
            className="h-12 px-4 rounded-2xl border border-warm-200 text-ink inline-flex items-center gap-1.5 hover:bg-warm-50 disabled:opacity-40"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={2} /> Retour
          </button>

          {q.optional && (
            <button
              type="button"
              onClick={s.flow.skip}
              className="h-12 px-4 rounded-2xl border border-warm-200 text-warm-600 inline-flex items-center gap-1.5 hover:bg-warm-50"
            >
              <SkipForward className="w-4 h-4" strokeWidth={2} /> Passer
            </button>
          )}

          <button
            type="button"
            onClick={s.submitDraft}
            disabled={!s.canSubmitDraft}
            className="ml-auto h-12 px-5 rounded-2xl bg-ink text-paper text-[14px] font-semibold inline-flex items-center gap-1.5 hover:bg-warm-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Suivant <ArrowRight className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  )
}
