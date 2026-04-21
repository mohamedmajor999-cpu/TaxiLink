// Types et libellés du flux guidé de création de mission.

export type QuestionCategory =
  | 'type'
  | 'patient'
  | 'trajet'
  | 'horaire'
  | 'accompagnement'
  | 'diffusion'

export type ChoiceOption = {
  value: string
  label: string
  aliases?: string[] // synonymes acceptés à la voix
}

export type GuidedInputKind =
  | 'choice'
  | 'text'
  | 'address'
  | 'date'
  | 'time'
  | 'phone'
  | 'passengers'
  | 'boolean'
  | 'groups'

export type GuidedVisibilityState = {
  type: 'CPAM' | 'PRIVE' | 'TAXILINK'
  returnTrip: boolean
  visibility: 'PUBLIC' | 'GROUP'
}

export type GuidedQuestion = {
  id: string
  category: QuestionCategory
  prompt: string       // texte lu par la synthèse vocale
  shortLabel: string   // label de progression et en-tête d'écran
  kind: GuidedInputKind
  options?: ChoiceOption[]
  optional?: boolean   // true = bouton « Passer » autorisé
  isVisible: (s: GuidedVisibilityState) => boolean
}

export const CATEGORY_LABELS: Record<QuestionCategory, string> = {
  type: 'Type de course',
  patient: 'Patient & contact',
  trajet: 'Trajet',
  horaire: 'Date & horaire',
  accompagnement: 'Accompagnement',
  diffusion: 'Diffusion',
}

export const always = () => true
export const isCpam = (s: GuidedVisibilityState) => s.type === 'CPAM'
export const isPrive = (s: GuidedVisibilityState) => s.type === 'PRIVE'
export const isCpamReturn = (s: GuidedVisibilityState) => s.type === 'CPAM' && s.returnTrip
export const isGroupVisibility = (s: GuidedVisibilityState) => s.visibility === 'GROUP'
