import { api } from './lib/api'

// Types du flux guide vocal — duplique ici depuis apps/web/src/components/dashboard/driver/guided/guidedTypes
// pour decoupler le service de l'arborescence UI web. Si guidedTypes evolue cote
// web, penser a syncher ici (ou eventuellement deplacer en @taxilink/core).
export type GuidedInputKind =
  | 'choice'
  | 'text'
  | 'address'
  | 'date'
  | 'time'
  | 'phone'
  | 'passengers'
  | 'boolean'
  | 'groups'

export interface ChoiceOption {
  value: string
  label: string
  aliases?: string[]
}

export type VoiceAnswerIntent = 'answer' | 'back' | 'goto' | 'skip' | 'unclear'

export interface VoiceAnswerResult {
  intent: VoiceAnswerIntent
  value: unknown
  targetQuestionId: string | null
  transcript: string
}

export interface VoiceAnswerRequest {
  questionId: string
  kind: GuidedInputKind
  prompt: string
  options?: ChoiceOption[]
  /** Pour kind='groups' : liste des groupes dispo (id + nom) pour que l'IA matche. */
  availableGroups?: { id: string; name: string }[]
  allQuestionIds: string[]
}

export async function parseVoiceAnswer(
  req: VoiceAnswerRequest,
  audio: Blob
): Promise<VoiceAnswerResult> {
  const ext = (audio.type || 'audio/webm').includes('mp4') ? 'mp4' : 'webm'
  const file = new File([audio], `audio.${ext}`, { type: audio.type || 'audio/webm' })
  const form = new FormData()
  form.append('audio', file)
  form.append('meta', JSON.stringify(req))
  return api.postForm<VoiceAnswerResult>('/api/missions/parse-voice-answer', form)
}
