'use client'

import { useState } from 'react'

// Hook : suppression de compte par email cote admin. Demande une double
// confirmation (taper l'email exact dans un second champ) avant POST.
export function useModerationSection() {
  const [email, setEmail] = useState('')
  const [confirmEmail, setConfirmEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{ kind: 'ok' | 'error'; message: string } | null>(null)

  const trimmed = email.trim().toLowerCase()
  const trimmedConfirm = confirmEmail.trim().toLowerCase()
  const isValid = trimmed.length > 3 && trimmed === trimmedConfirm

  async function deleteAccount() {
    if (!isValid || busy) return
    setBusy(true)
    setResult(null)
    try {
      const res = await fetch('/api/admin/users/delete-by-email', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(body.error ?? `Erreur ${res.status}`)
      }
      setResult({ kind: 'ok', message: `Compte ${trimmed} anonymisé et supprimé.` })
      setEmail('')
      setConfirmEmail('')
    } catch (err) {
      setResult({ kind: 'error', message: err instanceof Error ? err.message : 'Erreur inconnue' })
    } finally {
      setBusy(false)
    }
  }

  return { email, setEmail, confirmEmail, setConfirmEmail, isValid, busy, result, deleteAccount }
}
