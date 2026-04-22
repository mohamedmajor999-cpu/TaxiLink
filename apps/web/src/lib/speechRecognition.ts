// Web Speech API — types minimaux et accesseur cross-browser.
// Les types officiels ne sont pas dans lib.dom.d.ts pour tous les environnements ;
// on les redéclare localement pour rester autonome.

interface SpeechRecognitionAlternative {
  transcript: string
}
export interface SpeechRecognitionResult {
  0: SpeechRecognitionAlternative
  isFinal: boolean
}
interface SpeechRecognitionResultList {
  length: number
  [index: number]: SpeechRecognitionResult
}
export interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList
  resultIndex: number
}
export interface SpeechRecognitionErrorEvent {
  error: string
}
export interface SpeechRecognitionInstance {
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

export function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}
