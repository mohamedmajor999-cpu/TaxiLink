// Reporter d'erreurs cross-platform. Web : @sentry/nextjs. Mobile : @sentry/react-native.
// Pattern d'injection : chaque app appelle setErrorReporter() au boot avec son
// integration Sentry. Defaut : no-op pour ne pas casser les services en l'absence
// de Sentry (ex. tests, dev local sans DSN).

type Tags = Record<string, string>

export interface ErrorReporter {
  captureException(error: unknown, options?: { tags?: Tags }): void
}

const noop: ErrorReporter = {
  captureException: () => {},
}

let _impl: ErrorReporter = noop

export function setErrorReporter(impl: ErrorReporter): void {
  _impl = impl
}

export function resetErrorReporter(): void {
  _impl = noop
}

export function reportError(error: unknown, options?: { tags?: Tags }): void {
  try {
    _impl.captureException(error, options)
  } catch {
    // ne jamais propager une erreur de reporting — eviter les boucles.
  }
}
