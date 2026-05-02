'use client'
import { Truck, Pencil } from 'lucide-react'
import type { Mission } from '@/lib/supabase/types'
import { useMissionEditSheetStore } from '@/store/missionEditSheetStore'
import { formatTime } from '@/lib/dateUtils'
import { formatMissionPrice } from '@/lib/formatMissionPrice'
import { AdTracker } from './AdTracker'
import { TakerBlock } from './TakerBlock'
import type { DriverProfile } from './adsHelpers'

interface Props {
  mission: Mission
  driver: DriverProfile | null
  now: number
}

function timeSinceAccept(acceptedIso: string | null): string {
  if (!acceptedIso) return ''
  const diff = Math.max(0, Math.round((Date.now() - new Date(acceptedIso).getTime()) / 60_000))
  if (diff < 1) return "à l'instant"
  if (diff < 60) return `il y a ${diff} min`
  const h = Math.floor(diff / 60)
  if (h < 24) return `il y a ${h} h`
  return `il y a ${Math.floor(h / 24)} j`
}

export function AdCardAccepted({ mission, driver, now }: Props) {
  const time = formatTime(mission.scheduled_at)
  const isCpam = mission.transport_type === 'CPAM'
  const openEdit = useMissionEditSheetStore((s) => s.open)
  const subline = mission.accepted_at
    ? `Acceptée ${timeSinceAccept(mission.accepted_at)}`
    : 'Acceptée'

  return (
    <article className="rounded-2xl px-4 py-3 border border-blue-200 bg-blue-50">
      <header className="flex items-center gap-2 mb-2">
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-200 text-blue-900 text-[10.5px] font-extrabold uppercase tracking-[0.04em]">
          <Truck className="w-3 h-3" strokeWidth={2.4} />
          Acceptée
        </span>
        <span className="ml-auto text-[12px] font-bold text-ink tabular-nums">{time}</span>
      </header>
      <p className="text-[14px] font-semibold text-ink leading-tight">
        {mission.departure} <span className="text-warm-300">→</span> {mission.destination}
      </p>
      <div className="mt-1.5 flex items-center gap-3 text-[12px] text-warm-700">
        <span><b className="text-ink font-extrabold">{formatMissionPrice(mission)}</b> · {isCpam ? 'CPAM' : 'Privé'}</span>
        {mission.patient_name && <span className="truncate">{mission.patient_name}</span>}
      </div>

      <TakerBlock driver={driver} subline={subline} />

      <AdTracker mission={mission} now={now} />

      <div className="mt-2.5 pt-2 border-t border-dashed border-blue-200/60 flex items-center justify-between text-[11.5px] text-warm-500">
        <span>Infos patient ou adresse incorrectes ?</span>
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
