import type { Document } from '@/lib/supabase/types'

export type DocumentStatus = 'valid' | 'expiring' | 'expired' | 'pending' | 'invalid' | 'missing'

const EXPIRING_THRESHOLD_DAYS = 30

export interface DocumentSlot {
  type: string
  label: string
  optional?: boolean
  cta?: string
}

export const MANDATORY_DOCS: DocumentSlot[] = [
  { type: 'carte_grise', label: 'Carte grise' },
  { type: 'permis',      label: 'Permis de conduire' },
  { type: 'carte_pro',   label: 'Carte professionnelle' },
  { type: 'assurance',   label: 'Assurance' },
]

export const OPTIONAL_DOCS: DocumentSlot[] = [
  { type: 'convention_cpam', label: 'Convention CPAM', optional: true, cta: 'Ajouter pour courses CPAM' },
]

export function computeStatus(doc: Document | null): DocumentStatus {
  if (!doc) return 'missing'
  const status = (doc.status ?? '').toLowerCase()
  if (status === 'invalid' || status === 'rejected') return 'invalid'
  if (status === 'pending') return 'pending'
  if (!doc.expiry_date) return 'valid'
  const expiry = new Date(doc.expiry_date).getTime()
  const now = Date.now()
  if (expiry <= now) return 'expired'
  const daysLeft = Math.floor((expiry - now) / 86_400_000)
  if (daysLeft <= EXPIRING_THRESHOLD_DAYS) return 'expiring'
  return 'valid'
}

export function daysUntilExpiry(doc: Document | null): number | null {
  if (!doc?.expiry_date) return null
  const ms = new Date(doc.expiry_date).getTime() - Date.now()
  return Math.max(0, Math.ceil(ms / 86_400_000))
}

export function formatExpiry(isoDate: string | null): string | null {
  if (!isoDate) return null
  const d = new Date(isoDate)
  if (Number.isNaN(d.getTime())) return null
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${m}/${d.getFullYear()}`
}
