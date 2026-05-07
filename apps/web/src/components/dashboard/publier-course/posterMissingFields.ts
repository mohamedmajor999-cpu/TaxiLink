import type { MissionFormState } from '@/components/dashboard/driver/useMissionFormState'
import type { GuidedInputKind, ChoiceOption } from '@/components/dashboard/driver/guided/guidedTypes'

export interface PosterMissingField {
  id:       string
  prompt:   string
  /** Type d'attente côté parser de réponse (`/api/missions/parse-voice-answer`). */
  kind:     GuidedInputKind
  options?: ChoiceOption[]
}

interface Options {
  parsedFields: Set<string>
}

const TYPE_OPTIONS: ChoiceOption[] = [
  { value: 'CPAM',  label: 'CPAM',  aliases: ['cpam', 'médical', 'medical', 'sécu', 'secu'] },
  { value: 'PRIVE', label: 'Privé', aliases: ['privé', 'prive', 'privée', 'privee', 'standard'] },
]
const MOTIF_OPTIONS: ChoiceOption[] = [
  { value: 'HDJ',          label: 'Hôpital de jour', aliases: ['hdj', 'hôpital de jour', 'hopital de jour', 'hospitalisation de jour', 'dialyse', 'chimio'] },
  { value: 'CONSULTATION', label: 'Consultation',    aliases: ['consultation', 'rdv', 'rendez-vous', 'rendez vous', 'examen'] },
]

const FIELDS: Record<string, Omit<PosterMissingField, 'id'>> = {
  type:         { prompt: 'Quel type de course ? Standard ou CPAM ?',  kind: 'choice', options: TYPE_OPTIONS },
  departure:    { prompt: 'Quelle est l’adresse de départ ?',            kind: 'address' },
  destination:  { prompt: 'Quelle est l’adresse d’arrivée ?',            kind: 'address' },
  date:         { prompt: 'Pour quel jour ?',                            kind: 'date' },
  time:         { prompt: 'À quelle heure de prise en charge ?',         kind: 'time' },
  phone:        { prompt: 'Quel numéro de téléphone du patient ?',       kind: 'phone' },
  medicalMotif: { prompt: 'Hôpital de jour ou consultation ?',           kind: 'choice', options: MOTIF_OPTIONS },
  returnTrip:   { prompt: 'Aller simple ou aller-retour ?',              kind: 'boolean' },
  passengers:   { prompt: 'Combien de patients à transporter ?',         kind: 'passengers' },
  groupIds:     { prompt: 'À quel groupe voulez-vous publier ?',         kind: 'groups' },
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
  const push = (id: keyof typeof FIELDS) => out.push({ id, ...FIELDS[id] })

  if (!p.has('type') && !p.has('medicalMotif'))   push('type')
  if (form.departure.trim().length < 5)            push('departure')
  if (form.destination.trim().length < 5)          push('destination')
  if (!p.has('date'))                              push('date')
  if (!p.has('time'))                              push('time')
  if (!p.has('phone') && !form.phone.trim())       push('phone')

  if (form.type === 'CPAM') {
    if (!form.medicalMotif)                        push('medicalMotif')
    if (!p.has('returnTrip'))                      push('returnTrip')
    if (!p.has('passengers'))                      push('passengers')
  }

  if (form.visibility === 'GROUP' && form.groupIds.length === 0) push('groupIds')

  return out
}
