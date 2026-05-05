'use client'

import { useState } from 'react'
import { adminModerationService } from '@/services/adminModerationService'
import { ApiRequestError } from '@/lib/api'

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
      await adminModerationService.deleteUserByEmail(trimmed)
      setResult({ kind: 'ok', message: `Compte ${trimmed} anonymisé et supprimé.` })
      setEmail('')
      setConfirmEmail('')
    } catch (err) {
      const message = err instanceof ApiRequestError || err instanceof Error
        ? err.message
        : 'Erreur inconnue'
      setResult({ kind: 'error', message })
    } finally {
      setBusy(false)
    }
  }

  return {
    email, setEmail,
    confirmEmail, setConfirmEmail,
    isValid, busy, result,
    deleteAccount,
  }
}
