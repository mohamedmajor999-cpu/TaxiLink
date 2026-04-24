'use client'
import { Clock, Loader2 } from 'lucide-react'
import type { Mission } from '@/lib/supabase/types'
import { useNextMissionBanner } from './useNextMissionBanner'

interface Props {
  mission: Mission
  onShowDetail: () => void
  onComplete?: (id: string) => void | Promise<void>
  userCoords?: { lat: number; lng: number } | null
}

const shortAddr = (a: string) => a.split(',')[0].trim()

export function NextMissionBanner({ mission, onShowDetail, onComplete, userCoords }: Props) {
  const v = useNextMissionBanner({ mission, onComplete, userCoords })

  return (
    <section
      aria-label={v.isStarted ? 'Course en cours' : 'Prochaine course'}
      className="mb-5 relative rounded-2xl bg-paper border border-warm-200 overflow-hidden"
    >
      <span aria-hidden="true" className={`absolute left-0 top-0 bottom-0 w-1 ${v.barClass}`} />

      <div className="pl-5 pr-3 py-3 flex items-center gap-3">
        <Clock className="w-5 h-5 text-ink shrink-0" strokeWidth={2.2} />

        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-bold text-ink leading-tight">
            {v.countdown}
          </p>
          <p className="text-[12px] text-warm-500 truncate mt-0.5">
            {shortAddr(mission.departure)}
          </p>
          <p className="text-[12px] text-warm-500 truncate">
            → {shortAddr(mission.destination)}
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onShowDetail}
            className="h-9 px-3 rounded-lg bg-paper border border-warm-200 text-ink text-[13px] font-semibold hover:bg-brand hover:border-ink transition-colors"
          >
            Détails
          </button>
          {v.showComplete && (
            <button
              type="button"
              onClick={v.handleComplete}
              disabled={v.completing}
              className="h-9 px-3 rounded-lg bg-ink text-paper text-[13px] font-semibold hover:brightness-110 active:brightness-125 transition-all disabled:opacity-60 inline-flex items-center gap-1.5"
            >
              {v.completing && <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2} />}
              Terminer
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
