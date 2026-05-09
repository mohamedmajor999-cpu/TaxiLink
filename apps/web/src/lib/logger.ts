import * as Sentry from '@sentry/nextjs'

type Level = 'info' | 'warn' | 'error'

function emit(level: Level, scope: string, message: string, data?: unknown) {
  const isProd = process.env.NODE_ENV === 'production'
  const prefix = `[${scope}]`

  if (level === 'error') {
    if (isProd) {
      const err = data instanceof Error ? data : new Error(message)
      Sentry.captureException(err, { tags: { scope }, extra: data instanceof Error ? undefined : { data } })
    }
    console.error(prefix, message, data ?? '')
    return
  }

  if (level === 'warn') {
    if (isProd) Sentry.captureMessage(`${prefix} ${message}`, { level: 'warning', tags: { scope }, extra: data ? { data } : undefined })
    console.warn(prefix, message, data ?? '')
    return
  }

  if (!isProd) console.log(prefix, message, data ?? '')
}

export function createLogger(scope: string) {
  return {
    info:  (message: string, data?: unknown) => emit('info',  scope, message, data),
    warn:  (message: string, data?: unknown) => emit('warn',  scope, message, data),
    error: (message: string, data?: unknown) => emit('error', scope, message, data),
  }
}
