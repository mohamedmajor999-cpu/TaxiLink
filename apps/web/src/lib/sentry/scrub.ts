import type { ErrorEvent, Event, EventHint } from '@sentry/nextjs'

type AnyEvent = ErrorEvent | Event
type Breadcrumb = NonNullable<AnyEvent['breadcrumbs']>[number]
type ExceptionValue = NonNullable<NonNullable<ErrorEvent['exception']>['values']>[number]

// TaxiLink transporte des donnees patient (transport CPAM). Sentry ne doit
// JAMAIS recevoir de PII medicales. On scrub recursivement event.request,
// event.contexts, event.extra, event.breadcrumbs avant l'envoi.
//
// Cles considerees comme sensibles (case-insensitive, partial match) : tout
// champ dont le nom contient un de ces tokens. La valeur est remplacee par
// '[REDACTED]' (string) ou null (autres types) pour preserver la forme.
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

const REDACTED = '[REDACTED]'

// Regex de remplacement dans les chaines libres (messages d'exception, breadcrumbs).
// On cible les patterns les plus courants : telephones FR + emails.
const PHONE_FR_RE = /\b(?:\+33|0)\s?[1-9](?:[\s.-]?\d{2}){4}\b/g
const EMAIL_RE = /\b[\w.-]+@[\w.-]+\.\w{2,}\b/gi

function isSensitiveKey(key: string): boolean {
  const k = key.toLowerCase()
  return SENSITIVE_KEY_TOKENS.some((token) => k.includes(token))
}

function redactString(s: string): string {
  return s.replace(PHONE_FR_RE, REDACTED).replace(EMAIL_RE, REDACTED)
}

function scrubValue(value: unknown, depth = 0): unknown {
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

export function scrubEvent<T extends AnyEvent>(
  event: T,
  _hint?: EventHint,
): T {
  // request: query params, body, headers
  if (event.request) {
    event.request = scrubValue(event.request) as T['request']
  }
  // contexts: contexte applicatif (user, etc)
  if (event.contexts) {
    event.contexts = scrubValue(event.contexts) as T['contexts']
  }
  // extra: data ajoutee via Sentry.setExtra / captureException(_, { extra })
  if (event.extra) {
    event.extra = scrubValue(event.extra) as T['extra']
  }
  // tags: cle/valeur indexee
  if (event.tags) {
    event.tags = scrubValue(event.tags) as T['tags']
  }
  // breadcrumbs: chaque breadcrumb peut avoir data + message
  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs.map((b: Breadcrumb) => ({
      ...b,
      message: typeof b.message === 'string' ? redactString(b.message) : b.message,
      data: b.data ? (scrubValue(b.data) as typeof b.data) : b.data,
    }))
  }
  // exception values : message d'erreur peut contenir patient name si throw new Error(`patient ${name} ...`)
  if ('exception' in event && event.exception?.values) {
    event.exception.values = event.exception.values.map((ex: ExceptionValue) => ({
      ...ex,
      value: typeof ex.value === 'string' ? redactString(ex.value) : ex.value,
    }))
  }
  // user : on garde l'id mais on retire email/username/ip qui sont des PII
  if (event.user) {
    const { id } = event.user
    event.user = id ? { id } : undefined
  }
  return event
}
