import { api } from '@/lib/api'
import type { MissionFormType } from '@/components/dashboard/driver/missionFormHelpers'
import type { MedicalMotif, MissionVisibility, TransportType } from '@/lib/validators'

export interface ParsedMissionFields {
  type: MissionFormType | null
  medical_motif: MedicalMotif | null
  transport_type: TransportType | null
  return_trip: boolean
  return_time: string | null
  companion: boolean
  passengers: number | null
  departure: string | null
  destination: string | null
  date: string | null
  time: string | null
  price_eur: number | null
  price_min_eur: number | null
  price_max_eur: number | null
  patient_name: string | null
  phone: string | null
  visibility: MissionVisibility | null
  group_names: string[]
  transcript: string
}

export async function parseVoiceAudio(audio: Blob): Promise<ParsedMissionFields> {
  const ext = (audio.type || 'audio/webm').includes('mp4') ? 'mp4' : 'webm'
  const file = new File([audio], `audio.${ext}`, { type: audio.type || 'audio/webm' })
  const form = new FormData()
  form.append('audio', file)
  return api.postForm<ParsedMissionFields>('/api/missions/parse-voice', form)
}
