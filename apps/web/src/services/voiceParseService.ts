// Re-export depuis @taxilink/services. Wrapper appelle ensureBridge() avant
// delegation pour garantir que `setApiImpl(webApi)` est invoque (le webApi
// est mocke en tests).
import { parseVoiceAudio as _parseVoiceAudio, type ParsedMissionFields } from '@taxilink/services'
import { ensureBridge } from './_bridge'

export type { ParsedMissionFields }

export async function parseVoiceAudio(audio: Blob): Promise<ParsedMissionFields> {
  ensureBridge()
  return _parseVoiceAudio(audio)
}
