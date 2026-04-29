'use client'
import { ChevronRight } from 'lucide-react'
import type { Mission } from '@/lib/supabase/types'
import { computeDisplayFare } from '@/lib/missionFare'

const TYPE_LABEL: Record<string, string> = {
  CPAM: 'Médical',
  PRIVE: 'Privé',
  TAXILINK: 'TaxiLink',
}

const URGENT_THRESHOLD_MS = 2 * 3_600_000

interface Props {
  mission: Mission
  takerName?: string | null
  onClick: () => void
}

export function PostedRow({ mission, takerName, onClick }: Props) {
  const isWaiting = mission.status === 'AVAILABLE'
  const fare = computeDisplayFare(mission)
  const scheduled = new Date(mission.scheduled_at)
  const timeLabel = scheduled.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  const ms = scheduled.getTime() - Date.now()
  const isUrgent = isWaiting && ms > 0 && ms < URGENT_THRESHOLD_MS

  const taker = takerName?.trim() || null
  const initials = taker ? extractInitials(taker) : null
  const shortName = taker ? formatShortName(taker) : null

  const pinColor = isWaiting ? 'bg-brand ring-brand-soft' : 'bg-ink ring-warm-100'

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full grid grid-cols-[14px_1fr_auto] gap-2.5 items-center py-3 px-3 bg-paper border border-warm-200 rounded-2xl text-left hover:bg-warm-50 active:bg-warm-100 transition-colors"
    >
      <span
        className={`w-2.5 h-2.5 rounded-full shrink-0 ring-[3px] ${pinColor} ${
          isUrgent ? 'motion-safe:animate-pulse' : ''
        }`}
        aria-hidden
      />
      <span className="min-w-0">
        <span className="block text-[13px] font-bold text-ink truncate tracking-[-0.005em]">
          {mission.departure}
          <span className="text-warm-400 font-medium mx-1.5">→</span>
          {mission.destination}
        </span>
        <span className="mt-0.5 flex items-center gap-2 text-[11px] text-warm-500">
          <span className="font-semibold">{timeLabel}</span>
          <span aria-hidden>·</span>
          <span>{TYPE_LABEL[mission.type] ?? mission.type}</span>
          {initials && shortName && (
            <span className="ml-auto inline-flex items-center gap-1 bg-warm-100 rounded-full pr-2 pl-0.5 py-0.5 text-ink font-bold text-[10.5px]">
              <span className="w-3.5 h-3.5 rounded-full bg-ink text-paper text-[8px] font-extrabold inline-flex items-center justify-center">
                {initials}
              </span>
              {shortName}
            </span>
          )}
        </span>
      </span>
      <span className="flex items-center gap-1.5 shrink-0">
        <span className="text-[16px] font-extrabold tabular-nums tracking-[-0.02em] text-ink">
          {fare.value}
          <span className="text-[12px] font-bold">€</span>
        </span>
        <ChevronRight className="w-[18px] h-[18px] text-warm-400" strokeWidth={1.8} aria-hidden />
      </span>
    </button>
  )
}

function extractInitials(full: string): string {
  return full.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase()
}

function formatShortName(full: string): string {
  const parts = full.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]
  return `${parts[0][0]}. ${parts[parts.length - 1]}`
}
