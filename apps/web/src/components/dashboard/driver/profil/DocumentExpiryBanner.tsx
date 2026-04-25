'use client'
import { AlertTriangle } from 'lucide-react'

interface Props {
  docLabel: string
  daysLeft: number
}

export function DocumentExpiryBanner({ docLabel, daysLeft }: Props) {
  return (
    <div className="bg-brand-soft border border-brand/40 text-ink rounded-2xl px-4 py-3 mb-5 flex items-start gap-3">
      <span className="w-9 h-9 rounded-xl bg-brand grid place-items-center shrink-0">
        <AlertTriangle className="w-4 h-4 text-ink" strokeWidth={2.2} />
      </span>
      <p className="text-[12.5px] leading-snug pt-1">
        Votre <span className="font-semibold">{docLabel}</span> expire dans{' '}
        <span className="font-semibold">{daysLeft} jour{daysLeft > 1 ? 's' : ''}</span>.
        Renouvelez-la pour continuer à recevoir des courses.
      </p>
    </div>
  )
}
