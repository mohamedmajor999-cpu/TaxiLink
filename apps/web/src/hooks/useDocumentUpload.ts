import { useState, useRef } from 'react'
import { documentService } from '@/services/documentService'
import { DOC_CONFIG, type DocType } from '@/constants/documentConfig'
import type { Document } from '@/lib/supabase/types'

export function useDocumentUpload(
  userId: string | undefined,
  docs: Document[],
  onSuccess: () => Promise<void>
) {
  const [uploading, setUploading] = useState<DocType | null>(null)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pendingType = useRef<DocType | null>(null)

  const triggerUpload = (type: DocType) => {
    pendingType.current = type
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    const type = pendingType.current
    if (!file || !type || !userId) return
    e.target.value = ''

    setError('')
    setUploading(type)
    try {
      const filePath = await documentService.uploadFile(userId, type, file)
      const existing = docs.find((d) => d.type === type)
      await documentService.upsertDocument({
        existingId: existing?.id,
        driverId: userId,
        type,
        label: DOC_CONFIG[type].label,
        filePath,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'envoi")
      setUploading(null)
      return
    }
    // Le refresh est hors try : un echec ici n'est pas une erreur d'envoi
    // (le fichier est en base). Sinon l'user voyait "Erreur lors de l'envoi"
    // et re-uploadait un fichier deja sauvegarde.
    try { await onSuccess() } catch { /* silencieux */ }
    setUploading(null)
  }

  return { uploading, error, fileInputRef, triggerUpload, handleFileChange }
}
