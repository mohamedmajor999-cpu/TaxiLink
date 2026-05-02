'use client'
import { Clock } from 'lucide-react'
import type { Mission } from '@/lib/supabase/types'
import { formatTime } from '@/lib/dateUtils'
import { formatMissionPrice } from '@/lib/formatMissionPrice'

interface Props {
  mission: Mission
}

function timeSincePost(createdAtIso: string | null): string {
  if (!createdAtIso) return 'à l\'instant'
  const diffMin = Math.max(0, Math.round((Date.now() - new Date(createdAtIso).getTime()) / 60_000))
  if (diffMin < 1) return 'à l\'instant'
  if (diffMin < 60) return `${diffMin} min`
  const h = Math.floor(diffMin / 60)
  if (h < 24) return `${h} h${diffMin % 60 ? ' ' + (diffMin % 60) + ' min' : ''}`
  const d = Math.floor(h / 24)
  return `${d} j`
}

export function AdCardWaiting({ mission }: Props) {
  const time = formatTime(mission.scheduled_at)
  const isCpam = mission.transport_type === 'CPAM'
  const since = timeSincePost(mission.created_at)

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
    </article>
  )
}
