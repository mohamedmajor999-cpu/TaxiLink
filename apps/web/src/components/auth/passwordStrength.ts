export type StrengthLevel = 0 | 1 | 2 | 3 | 4

export interface PasswordCriteria {
  minLength:  boolean
  hasUpper:   boolean
  hasNumber:  boolean
  hasSpecial: boolean
}

export interface CriterionDisplay {
  text:  string
  color: string
  icon:  string
}

export interface PasswordStrengthInfo {
  level:      StrengthLevel
  label:      string
  segColor:   string
  labelColor: string
  criteria:   PasswordCriteria
  criteriaList: CriterionDisplay[]
}

const STRENGTH_LEVELS = [
  null,
  { label: 'Trop court', segColor: 'bg-rose-400',   labelColor: 'text-rose-400'   },
  { label: 'Faible',     segColor: 'bg-orange-300', labelColor: 'text-orange-400' },
  { label: 'Moyen',      segColor: 'bg-amber-300',  labelColor: 'text-amber-400'  },
  { label: 'Fort',       segColor: 'bg-teal-400',   labelColor: 'text-teal-500'   },
] as const

export function computeStrengthInfo(pw: string): PasswordStrengthInfo {
  const criteria: PasswordCriteria = {
    minLength:  pw.length >= 8,
    hasUpper:   /[A-Z]/.test(pw),
    hasNumber:  /[0-9]/.test(pw),
    hasSpecial: /[^a-zA-Z0-9]/.test(pw),
  }

  const criteriaList: CriterionDisplay[] = [
    { text: '8 caractères min.', color: criteria.minLength  ? 'text-teal-500' : 'text-muted', icon: criteria.minLength  ? '✓' : '·' },
    { text: 'Majuscule',         color: criteria.hasUpper   ? 'text-teal-500' : 'text-muted', icon: criteria.hasUpper   ? '✓' : '·' },
    { text: 'Chiffre',           color: criteria.hasNumber  ? 'text-teal-500' : 'text-muted', icon: criteria.hasNumber  ? '✓' : '·' },
    { text: 'Caractère spécial', color: criteria.hasSpecial ? 'text-teal-500' : 'text-muted', icon: criteria.hasSpecial ? '✓' : '·' },
  ]

  if (!pw) return { level: 0, label: '', segColor: '', labelColor: '', criteria, criteriaList }
  if (!criteria.minLength) return { level: 1, ...STRENGTH_LEVELS[1]!, criteria, criteriaList }

  const typeScore = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter(r => r.test(pw)).length
  if (typeScore <= 1) return { level: 2, ...STRENGTH_LEVELS[2]!, criteria, criteriaList }
  if (typeScore === 2) return { level: 3, ...STRENGTH_LEVELS[3]!, criteria, criteriaList }
  return                     { level: 4, ...STRENGTH_LEVELS[4]!, criteria, criteriaList }
}
