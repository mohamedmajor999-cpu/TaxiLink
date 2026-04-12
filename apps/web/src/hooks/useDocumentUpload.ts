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
      const publicUrl = await documentService.uploadFile(userId, type, file)
      const existing = docs.find((d) => d.type === type)
      await documentService.upsertDocument({
        existingId: existing?.id,
        driverId: userId,
        type,
        label: DOC_CONFIG[type].label,
        fileUrl: publicUrl,
      })
      await onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'envoi")
    } finally {
      setUploading(null)
    }
  }

  return { uploading, error, fileInputRef, triggerUpload, handleFileChange }
}
