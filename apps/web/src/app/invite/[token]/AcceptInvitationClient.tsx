'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { organizationService } from '@/services/organizationService'

const ERROR_LABELS: Record<string, string> = {
  INVITATION_NOT_FOUND: "Cette invitation n'existe pas ou a été révoquée.",
  INVITATION_accepted: "Cette invitation a déjà été acceptée.",
  INVITATION_cancelled: "Cette invitation a été annulée.",
  INVITATION_expired: "Cette invitation a expiré.",
  INVITATION_EXPIRED: "Cette invitation a expiré.",
  NOT_AUTHENTICATED: "Vous devez vous connecter pour accepter cette invitation.",
}

export function AcceptInvitationClient({ token }: { token: string }) {
  const router = useRouter()
  const [state, setState] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    organizationService
      .acceptInvitation(token)
      .then((res) => {
        if (res.success) {
          setState('success')
          setTimeout(() => router.push('/dashboard/patron'), 1500)
        } else {
          setState('error')
          setErrorMessage(ERROR_LABELS[res.error ?? ''] ?? `Erreur : ${res.error}`)
        }
      })
      .catch((e: Error) => {
        setState('error')
        setErrorMessage(e.message)
      })
  }, [token, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper dark:bg-night-bg p-4">
      <div className="max-w-md w-full rounded-2xl border border-warm-200 dark:border-night-border bg-paper dark:bg-night-surface p-8 text-center">
        {state === 'loading' && (
          <>
            <p className="text-3xl mb-3">⏳</p>
            <h1 className="text-lg font-extrabold text-ink dark:text-night-text">Acceptation de l&apos;invitation…</h1>
            <p className="text-sm text-warm-600 dark:text-night-text-soft mt-2">Un instant.</p>
          </>
        )}
        {state === 'success' && (
          <>
            <p className="text-3xl mb-3">✅</p>
            <h1 className="text-lg font-extrabold text-ink dark:text-night-text">Bienvenue dans la flotte !</h1>
            <p className="text-sm text-warm-600 dark:text-night-text-soft mt-2">Redirection vers le dashboard…</p>
          </>
        )}
        {state === 'error' && (
          <>
            <p className="text-3xl mb-3">⚠️</p>
            <h1 className="text-lg font-extrabold text-ink dark:text-night-text">Invitation non valide</h1>
            <p className="text-sm text-warm-600 dark:text-night-text-soft mt-2">{errorMessage}</p>
            <button
              type="button"
              onClick={() => router.push('/dashboard/chauffeur')}
              className="mt-6 w-full h-10 rounded-xl bg-ink dark:bg-night-brand text-paper dark:text-night-bg text-sm font-bold"
            >
              Retour à mon dashboard
            </button>
          </>
        )}
      </div>
    </div>
  )
}
