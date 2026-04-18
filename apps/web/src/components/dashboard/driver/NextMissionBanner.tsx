'use client'
import { useEffect, useState } from 'react'
import { ArrowRight, Clock } from 'lucide-react'
import type { Mission } from '@/lib/supabase/types'

interface Props {
  mission: Mission
  onShowDetail: () => void
}

const IMMINENT_MS = 15 * 60_000

export function NextMissionBanner({ mission, onShowDetail }: Props) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const target = new Date(mission.scheduled_at).getTime()
  const deltaMs = target - now
  const isStarted = deltaMs <= 0
  const isImminent = !isStarted && deltaMs <= IMMINENT_MS

  return (
    <section
      aria-label={isStarted ? 'Course en cours' : 'Prochaine course'}
      className="mb-5 rounded-2xl bg-ink text-paper p-4 md:p-5 shadow-soft"
    >
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`w-2 h-2 rounded-full ${
              isStarted ? 'bg-emerald-400 motion-safe:animate-pulse'
                : isImminent ? 'bg-brand motion-safe:animate-pulse'
                : 'bg-brand'
            }`}
          />
          <span className="text-[11px] font-bold uppercase tracking-wider text-paper/70">
            {isStarted ? 'Course en cours' : 'Prochaine course'}
          </span>
        </div>
        <div className="ml-auto inline-flex items-center gap-1.5 text-[22px] font-bold tabular-nums tracking-tight leading-none">
          <Clock className="w-4 h-4 text-brand" strokeWidth={2.2} />
          {isStarted ? 'Départ maintenant' : formatCountdown(deltaMs)}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] text-paper/70 truncate">{mission.departure}</p>
          <p className="text-[14px] font-semibold truncate">→ {mission.destination}</p>
        </div>
        <button
          type="button"
          onClick={onShowDetail}
          className="shrink-0 inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-brand text-ink text-[13px] font-bold hover:brightness-95 transition-all"
        >
          Détails
          <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
        </button>
      </div>
    </section>
  )
}

function formatCountdown(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const hrs = Math.floor(totalSec / 3600)
  const min = Math.floor((totalSec % 3600) / 60)
  if (hrs >= 1) return `Dans ${hrs}h ${String(min).padStart(2, '0')}`
  if (min >= 1) return `Dans ${min} min`
  const sec = totalSec % 60
  return `Dans ${sec}s`
}
