'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="fr">
      <body className="flex min-h-screen flex-col items-center justify-center bg-white p-6 text-center font-sans">
        <h1 className="mb-2 text-xl font-bold text-secondary">Une erreur est survenue</h1>
        <p className="mb-6 text-sm text-muted">
          L&apos;équipe a été notifiée automatiquement.
        </p>
        <button
          onClick={reset}
          className="rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-secondary"
        >
          Réessayer
        </button>
      </body>
    </html>
  )
}
