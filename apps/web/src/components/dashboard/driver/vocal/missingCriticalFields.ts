import type { MissionFormType } from '../missionFormHelpers'
import type { MedicalMotif } from '@/lib/validators'

export interface VocalFormSnapshot {
  type: MissionFormType
  medicalMotif: MedicalMotif | null
  departure: string
  destination: string
}

export interface MissingField {
  id: 'type' | 'medicalMotif' | 'departure' | 'destination' | 'date' | 'time'
  prompt: string
}

const FIELD_PROMPTS: Record<MissingField['id'], string> = {
  type: 'Il manque le type de course. Est-ce médical ou privé ?',
  medicalMotif: 'Il manque le type de consultation. Hôpital de jour ou consultation ?',
  departure: 'Il manque l’adresse de départ. Laquelle ?',
  destination: 'Il manque l’adresse d’arrivée. Quelle est la destination ?',
  date: 'Il manque la date. Pour quel jour ?',
  time: 'Il manque l’heure. À quelle heure ?',
}

interface Options {
  parsedFields: Set<string>
}

export function getMissingCriticalFields(s: VocalFormSnapshot, opts: Options): MissingField[] {
  const p = opts.parsedFields
  const missing: MissingField[] = []
  if (!p.has('type') && !p.has('medicalMotif')) missing.push({ id: 'type', prompt: FIELD_PROMPTS.type })
  if (s.type === 'CPAM' && !s.medicalMotif) missing.push({ id: 'medicalMotif', prompt: FIELD_PROMPTS.medicalMotif })
  if (s.departure.trim().length < 5) missing.push({ id: 'departure', prompt: FIELD_PROMPTS.departure })
  if (s.destination.trim().length < 5) missing.push({ id: 'destination', prompt: FIELD_PROMPTS.destination })
  if (!p.has('date')) missing.push({ id: 'date', prompt: FIELD_PROMPTS.date })
  if (!p.has('time')) missing.push({ id: 'time', prompt: FIELD_PROMPTS.time })
  return missing
}
