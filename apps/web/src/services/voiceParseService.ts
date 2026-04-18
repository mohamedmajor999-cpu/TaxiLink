import { api } from '@/lib/api'
import type { MissionFormType } from '@/components/dashboard/driver/missionFormHelpers'
import type { MedicalMotif } from '@/lib/validators'

export interface ParsedMissionFields {
  type: MissionFormType | null
  medical_motif: MedicalMotif | null
  departure: string | null
  destination: string | null
  date: string | null
  time: string | null
  price_eur: number | null
  patient_name: string | null
}

export async function parseVoiceTranscript(transcript: string): Promise<ParsedMissionFields> {
  return api.post<ParsedMissionFields>('/api/missions/parse-voice', { transcript })
}
