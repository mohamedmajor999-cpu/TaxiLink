import { api } from '@/lib/api'
import type { GuidedInputKind, ChoiceOption } from '@/components/dashboard/driver/guided/guidedTypes'

export type VoiceAnswerIntent = 'answer' | 'back' | 'goto' | 'skip' | 'unclear'

export interface VoiceAnswerResult {
  intent: VoiceAnswerIntent
  value: unknown
  targetQuestionId: string | null
}

export interface VoiceAnswerRequest {
  questionId: string
  kind: GuidedInputKind
  prompt: string
  options?: ChoiceOption[]
  allQuestionIds: string[]
  transcript: string
}

export async function parseVoiceAnswer(req: VoiceAnswerRequest): Promise<VoiceAnswerResult> {
  return api.post<VoiceAnswerResult>('/api/missions/parse-voice-answer', req)
}
