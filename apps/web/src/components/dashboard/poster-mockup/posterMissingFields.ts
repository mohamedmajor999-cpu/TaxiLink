import type { MissionFormState } from '@/components/dashboard/driver/useMissionFormState'

export interface PosterMissingField {
  id: string
  prompt: string
}

interface Options {
  parsedFields: Set<string>
}

const PROMPTS: Record<string, string> = {
  type: 'Quel type de course ? Standard ou CPAM ?',
  departure: 'Quelle est l’adresse de départ ?',
  destination: 'Quelle est l’adresse d’arrivée ?',
  date: 'Pour quel jour ?',
  time: 'À quelle heure de prise en charge ?',
  phone: 'Quel numéro de téléphone du patient ?',
  medicalMotif: 'Hôpital de jour ou consultation ?',
  returnTrip: 'Aller simple ou aller-retour ?',
  passengers: 'Combien de patients à transporter ?',
  groupIds: 'À quel groupe voulez-vous publier ?',
}

/**
 * Liste des champs critiques encore vides après dictée — sert au flow vocal de
 * relance TTS. L'ordre suit le questionnaire convenu : q1 type → q2 départ →
 * q3 arrivée → q4 date → q5 heure → q6 téléphone → (CPAM) q7a motif → q7b
 * aller-retour → q7c nombre de patients → q8 groupe.
 */
export function getPosterMissingFields(
  form: MissionFormState,
  opts: Options,
): PosterMissingField[] {
  const p = opts.parsedFields
  const out: PosterMissingField[] = []

  // q1 — type
  if (!p.has('type') && !p.has('medicalMotif')) {
    out.push({ id: 'type', prompt: PROMPTS.type })
  }

  // q2 / q3 — adresses
  if (form.departure.trim().length < 5) {
    out.push({ id: 'departure', prompt: PROMPTS.departure })
  }
  if (form.destination.trim().length < 5) {
    out.push({ id: 'destination', prompt: PROMPTS.destination })
  }

  // q4 / q5 — date / heure
  if (!p.has('date')) out.push({ id: 'date', prompt: PROMPTS.date })
  if (!p.has('time')) out.push({ id: 'time', prompt: PROMPTS.time })

  // q6 — téléphone
  if (!p.has('phone') && !form.phone.trim()) {
    out.push({ id: 'phone', prompt: PROMPTS.phone })
  }

  // q7 (CPAM) — motif, aller-retour, nombre de patients
  if (form.type === 'CPAM') {
    if (!form.medicalMotif) out.push({ id: 'medicalMotif', prompt: PROMPTS.medicalMotif })
    if (!p.has('returnTrip')) out.push({ id: 'returnTrip', prompt: PROMPTS.returnTrip })
    if (!p.has('passengers')) out.push({ id: 'passengers', prompt: PROMPTS.passengers })
  }

  // q8 — groupe (si visibilité Groupe et aucun coché)
  if (form.visibility === 'GROUP' && form.groupIds.length === 0) {
    out.push({ id: 'groupIds', prompt: PROMPTS.groupIds })
  }

  return out
}
