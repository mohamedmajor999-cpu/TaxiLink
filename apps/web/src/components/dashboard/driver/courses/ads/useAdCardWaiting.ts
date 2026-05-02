'use client'
import { useState } from 'react'
import { missionService } from '@/services/missionService'

export function useAdCardWaiting(missionId: string) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function requestCancel() {
    setError(null)
    setConfirmOpen(true)
  }
  function dismissConfirm() {
    if (busy) return
    setConfirmOpen(false)
  }

  async function confirmCancel() {
    setBusy(true)
    setError(null)
    try {
      await missionService.remove(missionId)
      // La realtime sub de useAdsTab retire la carte automatiquement.
      setConfirmOpen(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de l'annulation")
    } finally {
      setBusy(false)
    }
  }

  return { confirmOpen, busy, error, requestCancel, dismissConfirm, confirmCancel }
}
