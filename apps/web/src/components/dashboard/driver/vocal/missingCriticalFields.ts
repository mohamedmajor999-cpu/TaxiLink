import type { MissionFormType } from '../missionFormHelpers'
import type { MedicalMotif } from '@/lib/validators'

export interface VocalFormSnapshot {
  type: MissionFormType
  medicalMotif: MedicalMotif | null
  patientName: string
  departure: string
  destination: string
}

export interface MissingField {
  id: 'departure' | 'destination' | 'medicalMotif' | 'patientName'
  prompt: string
}

const FIELD_PROMPTS: Record<MissingField['id'], string> = {
  departure: 'Quelle est l’adresse de départ ?',
  destination: 'Quelle est l’adresse d’arrivée ?',
  medicalMotif: 'Est-ce une consultation ou un hôpital de jour ?',
  patientName: 'Quel est le nom du patient ?',
}

export function getMissingCriticalFields(s: VocalFormSnapshot): MissingField[] {
  const missing: MissingField[] = []
  if (s.departure.trim().length < 5) missing.push({ id: 'departure', prompt: FIELD_PROMPTS.departure })
  if (s.destination.trim().length < 5) missing.push({ id: 'destination', prompt: FIELD_PROMPTS.destination })
  if (s.type === 'CPAM') {
    if (!s.medicalMotif) missing.push({ id: 'medicalMotif', prompt: FIELD_PROMPTS.medicalMotif })
    if (!s.patientName.trim()) missing.push({ id: 'patientName', prompt: FIELD_PROMPTS.patientName })
  }
  return missing
}
