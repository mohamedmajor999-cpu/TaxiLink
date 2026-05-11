// Re-export depuis @taxilink/services. Wrapper appelle ensureBridge() avant
// delegation.
import {
  parseVoiceAnswer as _parseVoiceAnswer,
  type VoiceAnswerRequest,
  type VoiceAnswerResult,
  type VoiceAnswerIntent,
} from '@taxilink/services'
import { ensureBridge } from './_bridge'

export type { VoiceAnswerRequest, VoiceAnswerResult, VoiceAnswerIntent }

export async function parseVoiceAnswer(
  req: VoiceAnswerRequest,
  audio: Blob
): Promise<VoiceAnswerResult> {
  ensureBridge()
  return _parseVoiceAnswer(req, audio)
}
