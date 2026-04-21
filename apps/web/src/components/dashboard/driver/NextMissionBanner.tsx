'use client'
import { ArrowRight, Clock, Loader2, MapPin } from 'lucide-react'
import type { Mission } from '@/lib/supabase/types'
import { RideBadge } from '@/components/taxilink/RideBadge'
import { useNextMissionBanner } from './useNextMissionBanner'

interface Props {
  mission: Mission
  onShowDetail: () => void
  onComplete?: (id: string) => void | Promise<void>
  userCoords?: { lat: number; lng: number } | null
}

export function NextMissionBanner({ mission, onShowDetail, onComplete, userCoords }: Props) {
  const v = useNextMissionBanner({ mission, onComplete, userCoords })

  return (
    <section
      aria-label={v.isStarted ? 'Course en cours' : 'Prochaine course'}
      className="mb-5 relative rounded-2xl bg-paper border border-warm-200 overflow-hidden"
    >
      <span aria-hidden="true" className="absolute left-0 top-0 bottom-0 w-1 bg-ink" />

      <div className="p-4 md:p-5 pl-5 md:pl-6">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full bg-ink text-paper text-[10px] font-bold uppercase tracking-wider">
            <span className={`w-1.5 h-1.5 rounded-full ${v.statusDotClass}`} />
            {v.isStarted ? 'Course en cours' : 'Prochaine course'}
          </span>
          <RideBadge variant={v.badge.variant}>{v.badge.label}</RideBadge>
          <div className="ml-auto inline-flex items-center gap-1.5 text-[14px] font-semibold tabular-nums tracking-tight text-ink">
            <Clock className="w-3.5 h-3.5 text-brand" strokeWidth={2.2} />
            {v.countdown}
          </div>
        </div>

        <div className="mt-4 flex items-start gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-[13px] text-warm-500 truncate">{mission.departure}</p>
            <p className="text-[15px] font-semibold text-ink truncate mt-0.5">→ {mission.destination}</p>
            {v.etaText && (
              <p className="mt-2 inline-flex items-center gap-1 text-[12px] text-warm-600 tabular-nums">
                <MapPin className="w-3 h-3" strokeWidth={2} />
                {v.etaText}
              </p>
            )}
          </div>
          <div className="shrink-0 text-right">
            {v.fare.isEstimated && (
              <div className="text-[10px] font-bold uppercase tracking-wider text-warm-500 leading-none mb-1.5">
                Estimé
              </div>
            )}
            <div className="text-[32px] md:text-[36px] font-bold leading-none text-ink tabular-nums tracking-tight">
              {v.fare.value}<span className="text-[20px] md:text-[22px]">€</span>
            </div>
          </div>
        </div>

        <div className={`mt-4 flex gap-2 ${v.showComplete ? 'flex-col sm:flex-row' : ''}`}>
          <button
            type="button"
            onClick={onShowDetail}
            className={`inline-flex items-center justify-center gap-1.5 h-11 px-4 rounded-lg bg-brand text-ink text-[14px] font-semibold hover:brightness-95 active:brightness-90 transition-all ${v.showComplete ? 'w-full sm:flex-1' : 'w-full'}`}
          >
            Voir les détails
            <ArrowRight className="w-4 h-4" strokeWidth={2.2} />
          </button>
          {v.showComplete && (
            <button
              type="button"
              onClick={v.handleComplete}
              disabled={v.completing}
              className="w-full sm:flex-1 inline-flex items-center justify-center gap-1.5 h-11 px-4 rounded-lg bg-ink text-paper text-[14px] font-semibold hover:brightness-110 active:brightness-125 transition-all disabled:opacity-60"
            >
              {v.completing && <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />}
              Terminer la course
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
