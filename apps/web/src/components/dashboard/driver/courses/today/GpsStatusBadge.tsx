'use client'
import { useGpsStatusBadge, type GpsStatus } from './useGpsStatusBadge'

const PRESET: Record<GpsStatus, { label: string; tone: 'green' | 'yellow' | 'red' | 'gray' }> = {
  active:    { label: 'Suivi GPS actif',    tone: 'green' },
  searching: { label: 'Recherche GPS…',     tone: 'yellow' },
  weak:      { label: 'Signal GPS faible',  tone: 'yellow' },
  prompt:    { label: 'GPS non autorisé',   tone: 'gray' },
  blocked:   { label: 'GPS bloqué',         tone: 'red' },
  disabled:  { label: 'Suivi désactivé',    tone: 'gray' },
  offline:   { label: 'Hors ligne',         tone: 'gray' },
}

const TONE: Record<'green' | 'yellow' | 'red' | 'gray', string> = {
  green:  'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  yellow: 'bg-amber-50 text-amber-800 ring-1 ring-amber-200',
  red:    'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
  gray:   'bg-warm-50 text-warm-700 ring-1 ring-warm-200',
}

const DOT: Record<'green' | 'yellow' | 'red' | 'gray', string> = {
  green:  'bg-emerald-500',
  yellow: 'bg-amber-500',
  red:    'bg-rose-500',
  gray:   'bg-warm-400',
}

export function GpsStatusBadge() {
  const { status, accuracyM } = useGpsStatusBadge()
  const cfg = PRESET[status]
  const showAccuracy = (status === 'active' || status === 'weak') && accuracyM != null
  const pulses = status === 'searching' || status === 'active'

  return (
    <span
      role="status"
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10.5px] font-bold ${TONE[cfg.tone]}`}
    >
      <span className={`size-1.5 rounded-full ${DOT[cfg.tone]} ${pulses ? 'motion-safe:animate-pulse' : ''}`} />
      <span>{cfg.label}</span>
      {showAccuracy && <span className="tabular-nums opacity-70">±{Math.round(accuracyM!)} m</span>}
    </span>
  )
}
