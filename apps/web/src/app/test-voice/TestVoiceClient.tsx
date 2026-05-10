'use client'

import { Mic, Square, Loader2 } from 'lucide-react'
import { useTestVoice } from './useTestVoice'

export function TestVoiceClient() {
  const { isRecording, isProcessing, result, error, start, stop } = useTestVoice()
  const busy = isRecording || isProcessing

  return (
    <div className="min-h-screen bg-paper px-4 py-10 max-w-xl mx-auto">
      <h1 className="text-[22px] font-bold text-ink mb-1">Test Whisper</h1>
      <p className="text-[13px] text-warm-500 mb-8">
        Enregistre ta voix, parle naturellement, puis appuie sur stop. Le texte transcrit s’affiche en bas.
      </p>

      <div className="flex flex-col items-center gap-6">
        <button
          type="button"
          onClick={isRecording ? stop : start}
          disabled={isProcessing}
          aria-label={isRecording ? 'Arrêter' : 'Enregistrer'}
          className={`w-32 h-32 rounded-full inline-flex items-center justify-center transition-all active:scale-95 ${
            isRecording ? 'bg-brand text-ink' : 'bg-ink text-paper hover:scale-105'
          } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isProcessing
            ? <Loader2 className="w-12 h-12 animate-spin" strokeWidth={1.8} />
            : isRecording
              ? <Square className="w-12 h-12 fill-current" strokeWidth={0} />
              : <Mic className="w-12 h-12" strokeWidth={1.8} />}
        </button>

        <p className="text-[14px] text-ink font-bold">
          {isProcessing ? 'Analyse…' : isRecording ? 'J’écoute…' : busy ? '' : 'Appuyez pour parler'}
        </p>
      </div>

      {error && (
        <div className="mt-8 p-4 rounded-2xl bg-danger-soft text-danger text-[13px]">
          Erreur : {error}
        </div>
      )}

      {result && (
        <div className="mt-8 p-4 rounded-2xl bg-warm-50 border border-warm-200">
          <div className="text-[11px] font-bold uppercase tracking-wider text-warm-500 mb-2">
            Transcription ({(result.elapsedMs / 1000).toFixed(1)}s)
          </div>
          <p className="text-[15px] text-ink leading-relaxed whitespace-pre-wrap">
            {result.text || '(vide)'}
          </p>
        </div>
      )}
    </div>
  )
}
