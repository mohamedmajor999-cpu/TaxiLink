import type { MissionFormState } from '@/components/dashboard/driver/useMissionFormState'

export interface PosterMissingField {
  id: string
  prompt: string
}

interface Options {
  parsedFields: Set<string>
}

const PROMPTS: Record<string, string> = {
  type: 'Quel type de course : médicale ou privée ?',
  medicalMotif: 'Quel est le motif médical : hôpital de jour ou consultation ?',
  departure: 'Quelle est l’adresse de départ ?',
  destination: 'Quelle est l’adresse d’arrivée ?',
  date: 'Pour quel jour ?',
  time: 'À quelle heure ?',
  phone: 'Quel est le numéro de téléphone du contact ?',
  returnTrip: 'Est-ce un aller-retour ou un aller simple ?',
  passengers: 'Combien de patients à transporter ?',
  groupIds: 'À quel groupe voulez-vous publier ?',
}

/**
 * Liste les champs critiques encore vides après une dictée. Sert au flow vocal
 * de relance TTS sur la page Poster une course.
 *
 * Standard : départ, arrivée, date, heure, type, téléphone.
 * CPAM : + motif, aller-retour, nombre de patients.
 * Toutes courses en visibilité GROUP : + groupes destinataires.
 */
export function getPosterMissingFields(
  form: MissionFormState,
  opts: Options,
): PosterMissingField[] {
  const p = opts.parsedFields
  const missing: PosterMissingField[] = []

  if (!p.has('type') && !p.has('medicalMotif')) {
    missing.push({ id: 'type', prompt: PROMPTS.type })
  }
  if (form.type === 'CPAM' && !form.medicalMotif) {
    missing.push({ id: 'medicalMotif', prompt: PROMPTS.medicalMotif })
  }
  if (form.departure.trim().length < 5) {
    missing.push({ id: 'departure', prompt: PROMPTS.departure })
  }
  if (form.destination.trim().length < 5) {
    missing.push({ id: 'destination', prompt: PROMPTS.destination })
  }
  if (!p.has('date')) missing.push({ id: 'date', prompt: PROMPTS.date })
  if (!p.has('time')) missing.push({ id: 'time', prompt: PROMPTS.time })
  if (!form.phone.trim()) missing.push({ id: 'phone', prompt: PROMPTS.phone })

  if (form.type === 'CPAM') {
    if (!p.has('returnTrip')) {
      missing.push({ id: 'returnTrip', prompt: PROMPTS.returnTrip })
    }
    if (!p.has('passengers') && form.passengers == null) {
      missing.push({ id: 'passengers', prompt: PROMPTS.passengers })
    }
  }

  if (form.visibility === 'GROUP' && form.groupIds.length === 0) {
    missing.push({ id: 'groupIds', prompt: PROMPTS.groupIds })
  }

  return missing
}
