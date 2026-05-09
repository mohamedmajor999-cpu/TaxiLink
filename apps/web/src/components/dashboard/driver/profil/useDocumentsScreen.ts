'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useDocumentUpload } from '@/hooks/useDocumentUpload'
import { documentService } from '@/services/documentService'
import type { Document } from '@/lib/supabase/types'
import type { DocType } from '@/constants/documentConfig'
import {
  MANDATORY_DOCS, OPTIONAL_DOCS, computeStatus, daysUntilExpiry, formatExpiry,
  type DocumentStatus, type DocumentSlot,
} from './documentStatus'

export interface DocumentRowData {
  type: string
  label: string
  status: DocumentStatus
  expiryLabel: string | null
  daysLeft: number | null
  cta?: string
}

export interface DocumentExpiryAlert {
  docLabel: string
  daysLeft: number
}

const ALERT_THRESHOLD_DAYS = 30

function buildRow(slot: DocumentSlot, doc: Document | null): DocumentRowData {
  const status = computeStatus(doc)
  return {
    type: slot.type,
    label: slot.label,
    status,
    expiryLabel: doc?.expiry_date ? formatExpiry(doc.expiry_date) : null,
    daysLeft: daysUntilExpiry(doc),
    cta: slot.cta,
  }
}

export function useDocumentsScreen() {
  const { user } = useAuth()
  const [docs, setDocs] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDocs = useCallback(async () => {
    if (!user) return
    try {
      const d = await documentService.getDocuments(user.id)
      setDocs(d)
      setError(null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { void loadDocs() }, [loadDocs])

  const upload = useDocumentUpload(user?.id, docs, loadDocs)

  const triggerUpload = useCallback((type: string) => {
    upload.triggerUpload(type as DocType)
  }, [upload])

  const computed = useMemo(() => {
    const byType = new Map(docs.map((d) => [d.type, d]))
    const mandatory = MANDATORY_DOCS.map((s) => buildRow(s, byType.get(s.type) ?? null))
    const optional  = OPTIONAL_DOCS.map((s) => buildRow(s, byType.get(s.type) ?? null))

    const all = [...mandatory, ...optional]
    const validCount = all.filter((r) => r.status === 'valid').length
    const totalCount = all.length

    const expiring = mandatory
      .filter((r) => r.status === 'expiring' && r.daysLeft !== null && r.daysLeft <= ALERT_THRESHOLD_DAYS)
      .sort((a, b) => (a.daysLeft ?? 0) - (b.daysLeft ?? 0))[0]
    const earliestExpiringAlert: DocumentExpiryAlert | null = expiring && expiring.daysLeft !== null
      ? { docLabel: expiring.label.toLowerCase(), daysLeft: expiring.daysLeft }
      : null

    return { mandatory, optional, validCount, totalCount, earliestExpiringAlert }
  }, [docs])

  return {
    loading,
    error: error ?? (upload.error || null),
    ...computed,
    triggerUpload,
    handleFileChange: upload.handleFileChange,
    fileInputRef: upload.fileInputRef,
    uploadingType: upload.uploading as string | null,
  }
}
