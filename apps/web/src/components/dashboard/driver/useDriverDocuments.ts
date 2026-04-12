import { useState, useEffect } from 'react'
import { documentService } from '@/services/documentService'
import { useAuth } from '@/hooks/useAuth'
import { useDocumentUpload } from '@/hooks/useDocumentUpload'
import { DOC_CONFIG, type DocType } from '@/constants/documentConfig'
import type { Document } from '@/lib/supabase/types'

export function useDriverDocuments() {
  const { user } = useAuth()
  const [docs, setDocs] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)

  const loadDocs = async () => {
    if (!user) return
    const data = await documentService.getDocuments(user.id)
    setDocs(data)
    setLoading(false)
  }

  useEffect(() => { loadDocs() }, [user])

  const { uploading, error, fileInputRef, triggerUpload, handleFileChange } =
    useDocumentUpload(user?.id, docs, loadDocs)

  const allTypes = Object.keys(DOC_CONFIG) as DocType[]
  const validCount = allTypes.filter((t) => docs.find((d) => d.type === t)?.status === 'valid').length

  return { docs, loading, allTypes, validCount, uploading, error, fileInputRef, triggerUpload, handleFileChange }
}
