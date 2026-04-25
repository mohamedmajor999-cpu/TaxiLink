'use client'
import { Check, Clock, AlertCircle, Plus, ChevronRight } from 'lucide-react'
import type { DocumentStatus } from './documentStatus'

interface Props {
  label: string
  status: DocumentStatus
  expiryLabel: string | null
  cta?: string
  onClick?: () => void
}

const STATUS_TEXT: Record<DocumentStatus, string> = {
  valid: 'Valide',
  expiring: 'À renouveler',
  expired: 'Expiré',
  pending: 'En vérification',
  invalid: 'Refusé',
  missing: 'Non fourni',
}

const STATUS_COLOR: Record<DocumentStatus, string> = {
  valid: 'text-emerald-600',
  expiring: 'text-amber-600',
  expired: 'text-danger',
  pending: 'text-amber-600',
  invalid: 'text-danger',
  missing: 'text-danger',
}

const ICON_BG: Record<DocumentStatus, string> = {
  valid: 'bg-emerald-100 text-emerald-600',
  expiring: 'bg-amber-100 text-amber-600',
  expired: 'bg-red-100 text-danger',
  pending: 'bg-amber-100 text-amber-600',
  invalid: 'bg-red-100 text-danger',
  missing: 'bg-red-100 text-danger',
}

function StatusIcon({ status }: { status: DocumentStatus }) {
  if (status === 'valid') return <Check className="w-4 h-4" strokeWidth={2.5} />
  if (status === 'expiring' || status === 'pending') return <Clock className="w-4 h-4" strokeWidth={2.2} />
  if (status === 'missing') return <Plus className="w-4 h-4" strokeWidth={2.5} />
  return <AlertCircle className="w-4 h-4" strokeWidth={2.2} />
}

export function DocumentRow({ label, status, expiryLabel, cta, onClick }: Props) {
  const description = expiryLabel
    ? `${STATUS_TEXT[status]} · Expire ${expiryLabel}`
    : status === 'missing' && cta
      ? `Non fourni · ${cta}`
      : STATUS_TEXT[status]

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border border-warm-200 bg-paper hover:bg-warm-50 text-left transition-colors"
    >
      <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${ICON_BG[status]}`}>
        <StatusIcon status={status} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-semibold text-ink leading-tight">{label}</div>
        <div className={`text-[12px] mt-0.5 truncate ${STATUS_COLOR[status]}`}>
          {description}
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-warm-400 shrink-0" strokeWidth={1.8} />
    </button>
  )
}
