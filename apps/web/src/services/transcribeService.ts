// Re-export depuis @taxilink/services. Wrapper appelle ensureBridge() avant
// delegation.
import { transcribeAudioBlob as _transcribeAudioBlob, type TranscribeResult } from '@taxilink/services'
import { ensureBridge } from './_bridge'

export type { TranscribeResult }

export async function transcribeAudioBlob(audio: Blob): Promise<TranscribeResult> {
  ensureBridge()
  return _transcribeAudioBlob(audio)
}
