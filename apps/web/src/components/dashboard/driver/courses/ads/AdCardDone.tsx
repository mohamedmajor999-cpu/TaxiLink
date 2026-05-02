'use client'
import { CheckCircle2, Pencil } from 'lucide-react'
import type { Mission } from '@/lib/supabase/types'
import { useMissionEditSheetStore } from '@/store/missionEditSheetStore'
import { formatTime } from '@/lib/dateUtils'
import { formatMissionPrice } from '@/lib/formatMissionPrice'
import { TakerBlock } from './TakerBlock'
import type { DriverProfile } from './adsHelpers'

interface Props {
  mission: Mission
  driver: DriverProfile | null
}

export function AdCardDone({ mission, driver }: Props) {
  const time = formatTime(mission.scheduled_at)
  const isCpam = mission.transport_type === 'CPAM'
  const openEdit = useMissionEditSheetStore((s) => s.open)

  // 3 horodatages clés à afficher au posteur :
  //  - acceptée : quand le collègue a pris l'annonce
  //  - démarrée : quand il s'est mis en route (enroute_at) sinon prise en charge (pickup_at)
  //  - terminée : dropoff_at sinon completed_at
  const acceptedAt = mission.accepted_at
  const startedAt = mission.enroute_at ?? mission.pickup_at
  const endedAt = mission.dropoff_at ?? mission.completed_at

  return (
    <article className="rounded-2xl px-4 py-3 border border-emerald-200 bg-emerald-50">
      <header className="flex items-center gap-2 mb-2">
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-200 text-emerald-900 text-[10.5px] font-extrabold uppercase tracking-[0.04em]">
          <CheckCircle2 className="w-3 h-3" strokeWidth={2.4} />
          Effectuée
        </span>
        <span className="ml-auto text-[12px] font-bold text-ink tabular-nums">{time}</span>
      </header>
      <p className="text-[14px] font-semibold text-ink leading-tight">
        {mission.departure} <span className="text-warm-300">→</span> {mission.destination}
      </p>
      <div className="mt-1.5 flex items-center gap-3 text-[12px] text-warm-700">
        <span><b className="text-ink font-extrabold">{formatMissionPrice(mission)}</b> · {isCpam ? 'CPAM' : 'Privé'}</span>
      </div>

      <TakerBlock driver={driver} subline="Course terminée" />

      <dl className="mt-2.5 grid grid-cols-3 gap-1.5 p-2.5 rounded-xl bg-paper/70 backdrop-blur-sm text-center">
        <Step label="Acceptée" iso={acceptedAt} />
        <Step label="Démarrée" iso={startedAt} />
        <Step label="Terminée" iso={endedAt} />
      </dl>

      <div className="mt-2.5 pt-2 border-t border-dashed border-emerald-200/60 flex items-center justify-between text-[11.5px] text-warm-500">
        <span>Le prix final était différent ?</span>
        <button
          type="button"
          onClick={() => openEdit(mission, 'price')}
          className="inline-flex items-center gap-1 text-emerald-700 font-bold hover:underline"
        >
          <Pencil className="w-3 h-3" strokeWidth={2} />
          Modifier le prix
        </button>
      </div>
    </article>
  )
}

function Step({ label, iso }: { label: string; iso: string | null }) {
  return (
    <div className="min-w-0">
      <dt className="text-[9.5px] font-bold uppercase tracking-[0.04em] text-warm-500">{label}</dt>
      <dd className="text-[12px] font-extrabold text-ink tabular-nums mt-0.5">
        {iso ? formatTime(iso) : '—'}
      </dd>
    </div>
  )
}
