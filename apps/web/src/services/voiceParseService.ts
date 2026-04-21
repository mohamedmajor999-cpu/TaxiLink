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
}

export async function parseVoiceTranscript(transcript: string): Promise<ParsedMissionFields> {
  return api.post<ParsedMissionFields>('/api/missions/parse-voice', { transcript })
}
