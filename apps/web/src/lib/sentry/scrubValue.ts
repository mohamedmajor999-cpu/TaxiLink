// Scrub recursif des valeurs avant envoi a Sentry. Voir scrub.ts pour le
// rationale RGPD/CPAM.

const SENSITIVE_KEY_TOKENS = [
  'patient',          // patient_name, patientPhone, patient.id...
  'medical_motif',
  'medicalmotif',
  'motif',            // motif medical CPAM
  'transcript',       // dictee vocale
  'phone',            // numero patient ET chauffeur
  'birthdate',
  'birth_date',
  'address',
  'adresse',
  'departure',
  'destination',
  'companion',
  'nir',              // numero securite sociale
  'social_security',
] as const

export const REDACTED = '[REDACTED]'

// Regex de remplacement dans les chaines libres (messages d'exception, breadcrumbs).
// On cible les patterns les plus courants : telephones FR + emails.
const PHONE_FR_RE = /\b(?:\+33|0)\s?[1-9](?:[\s.-]?\d{2}){4}\b/g
const EMAIL_RE = /\b[\w.-]+@[\w.-]+\.\w{2,}\b/gi

function isSensitiveKey(key: string): boolean {
  const k = key.toLowerCase()
  return SENSITIVE_KEY_TOKENS.some((token) => k.includes(token))
}

export function redactString(s: string): string {
  return s.replace(PHONE_FR_RE, REDACTED).replace(EMAIL_RE, REDACTED)
}

export function scrubValue(value: unknown, depth = 0): unknown {
  if (depth > 6) return value // garde-fou recursion
  if (value === null || value === undefined) return value
  if (typeof value === 'string') return redactString(value)
  if (Array.isArray(value)) return value.map((v) => scrubValue(v, depth + 1))
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (isSensitiveKey(k)) {
        out[k] = typeof v === 'string' ? REDACTED : null
      } else {
        out[k] = scrubValue(v, depth + 1)
      }
    }
    return out
  }
  return value
}
