'use client'

import { useState } from 'react'
import { authService } from '@/services/authService'
import { userRgpdService } from '@/services/userRgpdService'

// Hook : gere l'export RGPD (art. 20) et la suppression de compte (art. 17).
// L'UI ouvre une modal avec checkbox de confirmation pour eviter les
// suppressions accidentelles. L'export streame le JSON depuis /api/users/export
// vers un Blob telechargeable cote navigateur.
export function useProfileSectionRGPD() {
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmAck, setConfirmAck] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  async function downloadExport() {
    setExporting(true)
    setExportError(null)
    try {
      const blob = await userRgpdService.exportData()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `taxilink-mes-donnees-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Échec du téléchargement')
    } finally {
      setExporting(false)
    }
  }

  function openConfirm() {
    setConfirmAck(false)
    setDeleteError(null)
    setConfirmOpen(true)
  }
  function closeConfirm() {
    if (deleting) return
    setConfirmOpen(false)
  }

  async function confirmDelete() {
    if (!confirmAck || deleting) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await userRgpdService.deleteAccount()
      // Le backend a deja DELETE auth.users mais le SDK garde un cache du JWT
      // local — on appelle signOut() pour purger, puis hard redirect.
      await authService.signOut().catch(() => {})
      window.location.href = '/'
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Échec de la suppression')
      setDeleting(false)
    }
  }

  return {
    exporting, exportError, downloadExport,
    confirmOpen, confirmAck, setConfirmAck,
    deleting, deleteError,
    openConfirm, closeConfirm, confirmDelete,
  }
}
