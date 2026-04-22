import type { GuidedQuestion } from './guidedTypes'

/**
 * Vérifie qu'un brouillon est suffisamment rempli pour passer à la question
 * suivante. Les questions `optional` court-circuitent cette vérification.
 */
export function isDraftValid(q: GuidedQuestion, draft: unknown): boolean {
  switch (q.kind) {
    case 'choice':     return typeof draft === 'string' && draft.length > 0
    case 'boolean':    return typeof draft === 'boolean'
    case 'passengers': return typeof draft === 'number' && draft >= 1
    case 'groups':     return Array.isArray(draft) && draft.length > 0
    case 'address':    return (typeof draft === 'string' && draft.trim().length >= 5)
                          || (!!draft && typeof draft === 'object' && 'label' in draft)
    case 'text':       return typeof draft === 'string' && draft.trim().length > 0
    case 'phone':      return typeof draft === 'string' && draft.replace(/\D/g, '').length >= 10
    case 'date':       return typeof draft === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(draft)
    case 'time':       return typeof draft === 'string' && /^\d{1,2}:\d{2}$/.test(draft)
  }
}

export const FALLBACK_QUESTION: GuidedQuestion = {
  id: '__none__', category: 'type', prompt: '', shortLabel: '', kind: 'text', isVisible: () => false,
}
