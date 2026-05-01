'use client'
import { Wallet, Bell } from 'lucide-react'
import { useCoursesEarningsChip, type EarningsChipVariant } from './useCoursesEarningsChip'

interface Props {
  variant: EarningsChipVariant
}

export function CoursesEarningsChip({ variant }: Props) {
  const c = useCoursesEarningsChip(variant)

  if (c.loading) {
    return (
      <span
        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-warm-50 border border-warm-100 text-[12px] font-semibold text-warm-500 motion-safe:animate-pulse"
        aria-hidden="true"
      >
        <span className="w-3 h-3 rounded-full bg-warm-200" />
        ···
      </span>
    )
  }

  const Icon = variant === 'pendingAds' ? Bell : Wallet
  const iconColor = variant === 'pendingAds' ? 'text-ink' : 'text-success'

  if (c.unit === 'eur') {
    return (
      <span
        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-warm-50 border border-warm-100 text-[12px] font-semibold text-warm-500"
        aria-label={`${c.amount} euros gagnés ${c.label}`}
      >
        <Icon className={`w-3.5 h-3.5 ${iconColor}`} strokeWidth={2.4} />
        <b className="text-ink font-extrabold tabular-nums">{Math.round(c.amount)} €</b>
        <span className="text-warm-500">· {c.label}</span>
      </span>
    )
  }

  // unit = 'count'
  if (c.amount === 0) {
    return (
      <span
        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-warm-50 border border-warm-100 text-[12px] font-semibold text-warm-500"
        aria-label="Aucune annonce à voir"
      >
        <Icon className="w-3.5 h-3.5 text-warm-400" strokeWidth={2.4} />
        Aucune nouvelle
      </span>
    )
  }
  return (
    <span
      className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-brand/15 border border-brand/30 text-[12px] font-semibold text-ink"
      aria-label={`${c.amount} annonces à voir`}
    >
      <Icon className="w-3.5 h-3.5 text-ink" strokeWidth={2.4} />
      <b className="text-ink font-extrabold tabular-nums">{c.amount}</b>
      <span>· {c.label}</span>
    </span>
  )
}
