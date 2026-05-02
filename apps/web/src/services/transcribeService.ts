import { api } from '@/lib/api'

export interface TranscribeResult {
  text: string
  elapsedMs: number
}

export async function transcribeAudioBlob(audio: Blob): Promise<TranscribeResult> {
  const ext = (audio.type || 'audio/webm').includes('mp4') ? 'mp4' : 'webm'
  const file = new File([audio], `audio.${ext}`, { type: audio.type || 'audio/webm' })
  const form = new FormData()
  form.append('audio', file)
  return api.postForm<TranscribeResult>('/api/missions/transcribe', form)
}
