'use client'
import { Navigation2, Phone } from 'lucide-react'
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
  const phoneHref = mission.phone ? `tel:${mission.phone}` : null

  return (
    <article className="relative overflow-hidden rounded-2xl bg-ink text-paper p-4 mb-5">
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(135deg, transparent 0%, rgba(255,210,63,0.08) 100%)' }}
      />
      <div className="relative flex items-center justify-between mb-2">
        <div className="text-[11px] font-extrabold tracking-[0.08em] text-brand uppercase">
          ★ Prochaine course
        </div>
        <span className="text-[11.5px] text-paper/85 font-semibold">{delay}</span>
      </div>
      <div className="relative text-[17px] font-bold leading-tight">
        {mission.patient_name || 'Patient'}
      </div>

      <div className="relative mt-3 grid grid-cols-3 gap-2">
        <Cell label="Heure" value={time} />
        <Cell label="Départ" value={mission.departure} />
        <Cell label="Arrivée" value={mission.destination} />
      </div>

      <div className="relative mt-3 flex gap-2">
        <a
          href={navHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 h-12 rounded-xl bg-brand text-ink text-[14px] font-extrabold inline-flex items-center justify-center gap-2 hover:bg-brand/90 transition-colors"
        >
          <Navigation2 className="w-4 h-4" strokeWidth={2.2} />
          Démarrer
        </a>
        {phoneHref && (
          <a
            href={phoneHref}
            aria-label="Appeler le patient"
            className="w-12 h-12 rounded-xl border border-paper/20 bg-paper/10 inline-flex items-center justify-center text-paper hover:bg-paper/15 transition-colors"
          >
            <Phone className="w-5 h-5" strokeWidth={2} />
          </a>
        )}
      </div>
    </article>
  )
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-paper/[0.06] px-2 py-1.5 min-w-0">
      <div className="text-[9px] font-bold uppercase tracking-[0.06em] text-paper/50">{label}</div>
      <div className="text-[12.5px] font-bold mt-0.5 truncate">{value}</div>
    </div>
  )
}
