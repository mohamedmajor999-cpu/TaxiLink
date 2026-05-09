'use client'
import { useEffect, useRef } from 'react'
import { Clock, X } from 'lucide-react'
import type { Mission } from '@/lib/supabase/types'
import { formatTime } from '@/lib/dateUtils'
import { formatMissionPrice } from '@/lib/formatMissionPrice'
import { shareCourseOnWhatsApp } from '@/lib/shareWhatsApp'
import { usePostedUntakenStore, useIsMissionUnseenUntaken } from '@/store/postedUntakenStore'
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
  const isUnseen = useIsMissionUnseenUntaken(mission.id)
  const markSeen = usePostedUntakenStore((s) => s.markSeen)
  const ref = useRef<HTMLElement>(null)
  // Quand la carte devient "non-vue" (toast pas-prise reçu), on la fait
  // scroller dans la vue une seule fois — mirror de AdCardAccepted.
  const didScrollRef = useRef(false)
  useEffect(() => {
    if (!isUnseen || didScrollRef.current) return
    didScrollRef.current = true
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [isUnseen])

  return (
    <article
      ref={ref}
      onClick={isUnseen ? () => markSeen(mission.id) : undefined}
      className={`rounded-2xl px-4 py-3 border bg-amber-50 transition-colors min-w-0 overflow-hidden ${
        isUnseen
          ? 'border-brand ring-2 ring-brand/40 cursor-pointer'
          : 'border-amber-200'
      }`}
    >
      <header className="flex items-center gap-2 mb-2 min-w-0">
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10.5px] font-extrabold uppercase tracking-[0.04em] shrink-0">
          <Clock className="w-3 h-3" strokeWidth={2.4} />
          En attente
        </span>
        {isUnseen && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-brand text-ink text-[10px] font-extrabold uppercase tracking-[0.04em] shrink-0">
            Nouveau
          </span>
        )}
        <span className="ml-auto text-[12px] font-bold text-ink tabular-nums truncate min-w-0">
          {time}
          <span className="text-warm-500 font-medium"> · postée il y a {since}</span>
        </span>
      </header>
      <p className="text-[14px] font-semibold text-ink leading-tight break-words">
        {mission.departure} <span className="text-warm-300">→</span> {mission.destination}
      </p>
      <div className="mt-1.5 flex items-center gap-3 text-[12px] text-warm-700">
        <span><b className="text-ink font-extrabold">{formatMissionPrice(mission)}</b> · {isCpam ? 'CPAM' : 'Privé'}</span>
        {mission.patient_name && <span className="truncate">{mission.patient_name}</span>}
      </div>

      <div className="mt-2.5 pt-2 border-t border-dashed border-amber-200/60 flex items-center justify-between gap-2 text-[11.5px] text-warm-500">
        <button
          type="button"
          onClick={() => shareCourseOnWhatsApp({ id: mission.id, departure: mission.departure, destination: mission.destination })}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#25D366] text-paper font-extrabold text-[11.5px] hover:bg-[#1FB856] transition-colors"
          aria-label="Partager cette annonce sur WhatsApp"
        >
          <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" aria-hidden="true">
            <path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.2-.7.2-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4 0 1.4 1 2.7 1.2 2.9.1.2 2 3 4.8 4.2.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.6-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4 0-.1-.2-.2-.5-.4zM12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.4 1.3 4.9L2 22l5.3-1.4c1.4.8 3 1.2 4.7 1.2 5.5 0 10-4.5 10-10S17.5 2 12 2z"/>
          </svg>
          Partager
        </button>
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
