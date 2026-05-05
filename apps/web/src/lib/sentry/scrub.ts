import type { ErrorEvent, Event, EventHint } from '@sentry/nextjs'
import { redactString, scrubValue } from './scrubValue'

type AnyEvent = ErrorEvent | Event
type Breadcrumb = NonNullable<AnyEvent['breadcrumbs']>[number]
type ExceptionValue = NonNullable<NonNullable<ErrorEvent['exception']>['values']>[number]

// TaxiLink transporte des donnees patient (transport CPAM). Sentry ne doit
// JAMAIS recevoir de PII medicales. On scrub recursivement event.request,
// event.contexts, event.extra, event.breadcrumbs avant l'envoi.
//
// Detail des cles sensibles + regex dans scrubValue.ts.
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
