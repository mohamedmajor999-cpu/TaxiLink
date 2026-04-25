'use client'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { documentService } from '@/services/documentService'
import type { Document } from '@/lib/supabase/types'
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

interface State {
  loading: boolean
  error: string | null
  mandatory: DocumentRowData[]
  optional: DocumentRowData[]
  validCount: number
  totalCount: number
  earliestExpiringAlert: DocumentExpiryAlert | null
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

export function useDocumentsScreen(): State {
  const { user } = useAuth()
  const [docs, setDocs] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    setLoading(true)
    documentService.getDocuments(user.id)
      .then((d) => { if (!cancelled) setDocs(d) })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Erreur de chargement')
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [user])

  return useMemo<State>(() => {
    const byType = new Map(docs.map((d) => [d.type, d]))
    const mandatory = MANDATORY_DOCS.map((s) => buildRow(s, byType.get(s.type) ?? null))
    const optional  = OPTIONAL_DOCS.map((s) => buildRow(s, byType.get(s.type) ?? null))

    const all = [...mandatory, ...optional]
    const validCount = all.filter((r) => r.status === 'valid').length
    const totalCount = all.length

    const expiring = mandatory
      .filter((r) => r.status === 'expiring' && r.daysLeft !== null && r.daysLeft <= ALERT_THRESHOLD_DAYS)
      .sort((a, b) => (a.daysLeft ?? 0) - (b.daysLeft ?? 0))[0]
    const earliestExpiringAlert = expiring && expiring.daysLeft !== null
      ? { docLabel: expiring.label.toLowerCase(), daysLeft: expiring.daysLeft }
      : null

    return { loading, error, mandatory, optional, validCount, totalCount, earliestExpiringAlert }
  }, [docs, loading, error])
}
