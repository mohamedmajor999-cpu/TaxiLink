'use client'
import { useEffect, useRef } from 'react'
import { Truck, Pencil } from 'lucide-react'
import type { Mission } from '@/lib/supabase/types'
import { useMissionEditSheetStore } from '@/store/missionEditSheetStore'
import { usePostedAcceptStore, useIsMissionUnseen } from '@/store/postedAcceptStore'
import { formatTime } from '@/lib/dateUtils'
import { formatMissionPrice } from '@/lib/formatMissionPrice'
import { AdTracker } from './AdTracker'
import { TakerBlock } from './TakerBlock'
import { relativeAgo, type DriverProfile } from './adsHelpers'

interface Props {
  mission: Mission
  driver: DriverProfile | null
  now: number
}

export function AdCardAccepted({ mission, driver, now }: Props) {
  const time = formatTime(mission.scheduled_at)
  const isCpam = mission.transport_type === 'CPAM'
  const openEdit = useMissionEditSheetStore((s) => s.open)
  const postedAgo = relativeAgo(mission.created_at)
  const acceptedAgo = relativeAgo(mission.accepted_at)
  const subline = acceptedAgo ? `Acceptée il y a ${acceptedAgo}` : 'Acceptée'
  const isUnseen = useIsMissionUnseen(mission.id)
  const markSeen = usePostedAcceptStore((s) => s.markSeen)
  const ref = useRef<HTMLElement>(null)
  // Quand la carte devient "non-vue" (apres un accept realtime ou un retour de
  // notification navigateur), on la fait scroller dans la vue une seule fois.
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
      className={`rounded-2xl px-4 py-3 border bg-blue-50 transition-colors min-w-0 overflow-hidden ${
        isUnseen
          ? 'border-brand ring-2 ring-brand/40 cursor-pointer'
          : 'border-blue-200'
      }`}
    >
      <header className="flex items-center gap-2 mb-2 min-w-0">
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-200 text-blue-900 text-[10.5px] font-extrabold uppercase tracking-[0.04em] shrink-0">
          <Truck className="w-3 h-3" strokeWidth={2.4} />
          Acceptée
        </span>
        {isUnseen && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-brand text-ink text-[10px] font-extrabold uppercase tracking-[0.04em] shrink-0">
            Nouveau
          </span>
        )}
        <span className="ml-auto text-[12px] font-bold text-ink tabular-nums shrink-0">{time}</span>
      </header>
      <p className="text-[14px] font-semibold text-ink leading-tight break-words">
        {mission.departure} <span className="text-warm-300">→</span> {mission.destination}
      </p>
      <div className="mt-1.5 flex items-center gap-3 text-[12px] text-warm-700">
        <span><b className="text-ink font-extrabold">{formatMissionPrice(mission)}</b> · {isCpam ? 'CPAM' : 'Privé'}</span>
        {mission.patient_name && <span className="truncate">{mission.patient_name}</span>}
      </div>
      {(postedAgo || acceptedAgo) && (
        <p className="mt-1 text-[11px] text-warm-500">
          {postedAgo && <>Postée il y a {postedAgo}</>}
          {postedAgo && acceptedAgo && <span className="mx-1.5 text-warm-300">·</span>}
          {acceptedAgo && <>Acceptée il y a {acceptedAgo}</>}
        </p>
      )}

      <TakerBlock driver={driver} subline={subline} />

      <AdTracker mission={mission} now={now} />

      <div className="mt-2.5 pt-2 border-t border-dashed border-blue-200/60 flex items-center justify-between text-[11.5px] text-warm-500">
        <span>Adresse, téléphone ou patient à corriger ?</span>
        <button
          type="button"
          onClick={() => openEdit(mission, 'corrections')}
          className="inline-flex items-center gap-1 text-blue-700 font-bold hover:underline"
        >
          <Pencil className="w-3 h-3" strokeWidth={2} />
          Corriger
        </button>
      </div>
    </article>
  )
}
