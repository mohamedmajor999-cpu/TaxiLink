'use client'
import { Clock, X } from 'lucide-react'
import type { Mission } from '@/lib/supabase/types'
import { formatTime } from '@/lib/dateUtils'
import { formatMissionPrice } from '@/lib/formatMissionPrice'
import { relativeAgo } from './adsHelpers'
import { useAdCardWaiting } from './useAdCardWaiting'

interface Props {
  mission: Mission
}

export function AdCardWaiting({ mission }: Props) {
  const time = formatTime(mission.scheduled_at)
  const isCpam = mission.transport_type === 'CPAM'
  const since = relativeAgo(mission.created_at)
  const c = useAdCardWaiting(mission.id)

  return (
    <article className="rounded-2xl px-4 py-3 border border-amber-200 bg-amber-50">
      <header className="flex items-center gap-2 mb-2">
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10.5px] font-extrabold uppercase tracking-[0.04em]">
          <Clock className="w-3 h-3" strokeWidth={2.4} />
          En attente
        </span>
        <span className="ml-auto text-[12px] font-bold text-ink tabular-nums">
          {time}
          <span className="text-warm-500 font-medium"> · postée il y a {since}</span>
        </span>
      </header>
      <p className="text-[14px] font-semibold text-ink leading-tight">
        {mission.departure} <span className="text-warm-300">→</span> {mission.destination}
      </p>
      <div className="mt-1.5 flex items-center gap-3 text-[12px] text-warm-700">
        <span><b className="text-ink font-extrabold">{formatMissionPrice(mission)}</b> · {isCpam ? 'CPAM' : 'Privé'}</span>
        {mission.patient_name && <span className="truncate">{mission.patient_name}</span>}
      </div>

      <div className="mt-2.5 pt-2 border-t border-dashed border-amber-200/60 flex items-center justify-between text-[11.5px] text-warm-500">
        <span>Pas encore prise par un collègue</span>
        <button
          type="button"
          onClick={c.requestCancel}
          className="inline-flex items-center gap-1 text-danger font-bold hover:underline"
        >
          <X className="w-3 h-3" strokeWidth={2.4} />
          Annuler l&apos;annonce
        </button>
      </div>

      {c.confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-ink/40"
          role="dialog"
          aria-modal="true"
          onClick={c.dismissConfirm}
        >
          <div
            className="bg-paper w-full max-w-sm rounded-t-3xl md:rounded-3xl p-5 shadow-soft"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-[18px] font-extrabold text-ink mb-1">Annuler l&apos;annonce ?</h3>
            <p className="text-[13px] text-warm-600 mb-4">
              Elle sera retirée du fil. Tes collègues ne pourront plus la prendre.
            </p>
            {c.error && (
              <p className="mb-3 text-[12px] text-danger">{c.error}</p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={c.dismissConfirm}
                disabled={c.busy}
                className="flex-1 h-12 rounded-xl bg-warm-50 border border-warm-200 text-warm-700 text-[14px] font-bold disabled:opacity-50"
              >
                Garder
              </button>
              <button
                type="button"
                onClick={c.confirmCancel}
                disabled={c.busy}
                className="flex-1 h-12 rounded-xl bg-danger text-paper text-[14px] font-extrabold disabled:opacity-50"
              >
                {c.busy ? 'Annulation…' : 'Annuler'}
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  )
}
