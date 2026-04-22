import type { MissionFormType } from '../missionFormHelpers'
import type { MedicalMotif } from '@/lib/validators'

export interface VocalFormSnapshot {
  type: MissionFormType
  medicalMotif: MedicalMotif | null
  departure: string
  destination: string
  date: string
  time: string
}

export interface MissingField {
  id: 'departure' | 'destination' | 'datetime' | 'medicalMotif'
  prompt: string
}

const FIELD_PROMPTS: Record<MissingField['id'], string> = {
  departure: 'Il manque l’adresse de départ. Laquelle ?',
  destination: 'Il manque l’adresse d’arrivée. Quelle est la destination ?',
  datetime: 'Il manque la date et l’heure. Pour quand est la course ?',
  medicalMotif: 'Il manque le type médical. Est-ce une consultation ou un hôpital de jour ?',
}

interface Options {
  datetimeProvided: boolean
}

export function getMissingCriticalFields(s: VocalFormSnapshot, opts: Options): MissingField[] {
  const missing: MissingField[] = []
  if (s.departure.trim().length < 5) missing.push({ id: 'departure', prompt: FIELD_PROMPTS.departure })
  if (s.destination.trim().length < 5) missing.push({ id: 'destination', prompt: FIELD_PROMPTS.destination })
  if (!opts.datetimeProvided) missing.push({ id: 'datetime', prompt: FIELD_PROMPTS.datetime })
  if (s.type === 'CPAM' && !s.medicalMotif) missing.push({ id: 'medicalMotif', prompt: FIELD_PROMPTS.medicalMotif })
  return missing
}
