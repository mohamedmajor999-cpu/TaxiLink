'use client'
import { Navigation2 } from 'lucide-react'
import type { Mission } from '@/lib/supabase/types'
import { getMinutesUntil } from '@/lib/dateUtils'
import { formatDuration } from '@/lib/formatDuration'

interface Props {
  mission: Mission
}

export function NextMissionHero({ mission }: Props) {
  const minutesUntil = getMinutesUntil(mission.scheduled_at)
  const time = new Date(mission.scheduled_at).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })
  const navHref = `https://waze.com/ul?q=${encodeURIComponent(mission.destination)}&navigate=yes`
  const delay = minutesUntil <= 0 ? 'Maintenant' : `Dans ${formatDuration(minutesUntil)}`
  return (
    <article className="rounded-2xl bg-ink text-paper p-4 mb-5">
      <div className="text-[11px] font-extrabold tracking-[0.08em] text-brand uppercase mb-1.5">
        Prochaine course
      </div>
      <div className="text-[15px] font-bold leading-tight">
        {mission.patient_name || 'Patient'}
      </div>
      <div className="text-[12.5px] text-paper/75 mt-1 leading-tight">
        {delay} · {time} → {mission.destination}
      </div>
      <a
        href={navHref}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 w-full h-12 rounded-xl bg-brand text-ink text-[14px] font-bold inline-flex items-center justify-center gap-2 hover:bg-brand/90 transition-colors"
      >
        <Navigation2 className="w-4 h-4" strokeWidth={2.2} />
        Démarrer la navigation
      </a>
    </article>
  )
}
