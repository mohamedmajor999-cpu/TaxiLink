'use client'
import { Navigation2, ChevronRight } from 'lucide-react'
import { RideBadge } from '@/components/taxilink/RideBadge'
import { RouteTimeline } from '@/components/taxilink/RouteTimeline'
import { useUpcomingTab, type DayGroup } from './useUpcomingTab'
import { MissionDetailsModal } from './MissionDetailsModal'
import type { Mission } from '@/lib/supabase/types'

export function UpcomingTab() {
  const t = useUpcomingTab()

  if (t.loading) {
    return (
      <ul className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
        {[0, 1, 2].map((i) => (
          <li key={i} className="h-40 rounded-2xl bg-warm-100 motion-safe:animate-pulse" />
        ))}
      </ul>
    )
  }
  if (t.error) {
    return (
      <div className="mt-6 rounded-2xl border border-danger/30 bg-danger-soft p-5 text-sm text-danger">
        {t.error}
      </div>
    )
  }

  return (
    <div className="mt-6">
      <section className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
        <MiniStat
          dark
          label="Prochaine dans"
          value={t.nextInMinutes !== null ? `${t.nextInMinutes} min` : '—'}
          hint={t.next ? `${t.next.departure} → ${t.next.destination}` : 'Aucune prévue'}
        />
        <MiniStat
          label="Aujourd'hui"
          value={`${t.todayTotal}€`}
          hint={`${t.todayCount} course${t.todayCount > 1 ? 's' : ''}`}
        />
        <MiniStat
          label="Demain"
          value={`${t.tomorrowTotal}€`}
          hint={`${t.tomorrowCount} course${t.tomorrowCount > 1 ? 's' : ''} planifiée${t.tomorrowCount > 1 ? 's' : ''}`}
        />
      </section>

      {t.groups.length === 0 && (
        <div className="rounded-2xl border border-warm-200 bg-paper p-10 text-center">
          <p className="text-[20px] font-bold leading-tight text-ink mb-2 tracking-tight">
            Aucune course prévue
          </p>
          <p className="text-sm text-warm-600">Vos courses à venir s&apos;afficheront ici.</p>
        </div>
      )}

      {t.groups.map((g) => (
        <DaySection key={g.key} group={g} onShowDetails={t.openDetails} />
      ))}

      {t.detailsMission && (
        <MissionDetailsModal mission={t.detailsMission} onClose={t.closeDetails} />
      )}
    </div>
  )
}

function DaySection({
  group, onShowDetails,
}: { group: DayGroup; onShowDetails: (m: Mission) => void }) {
  return (
    <section className="mb-8">
      <header className="flex items-end justify-between mb-3">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-warm-500">
          {group.label}
        </h3>
        <span className="text-[11px] text-warm-500">
          {group.missions.length} course{group.missions.length > 1 ? 's' : ''} · {group.total}€
        </span>
      </header>
      <ul className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {group.missions.map((m) => (
          <li key={m.id}>
            <AssignedMissionCard mission={m} onShowDetails={onShowDetails} />
          </li>
        ))}
      </ul>
    </section>
  )
}

function AssignedMissionCard({
  mission, onShowDetails,
}: { mission: Mission; onShowDetails: (m: Mission) => void }) {
  const d = new Date(mission.scheduled_at)
  const timeLabel = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  const badge = mission.type === 'CPAM'
    ? { variant: 'medical' as const, label: 'Médical' }
    : mission.type === 'PRIVE'
      ? { variant: 'private' as const, label: 'Privé' }
      : { variant: 'fleet' as const, label: 'TaxiLink' }
  const isUrgent = mission.type === 'CPAM'
  const wazeHref = `https://waze.com/ul?q=${encodeURIComponent(mission.destination)}&navigate=yes`

  return (
    <article className="bg-paper border border-warm-200 rounded-2xl overflow-hidden shadow-soft">
      <div className="px-5 pt-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <RideBadge variant={badge.variant}>{badge.label}</RideBadge>
          <span className="text-[12px] font-semibold text-ink">{timeLabel}</span>
        </div>
        <span className="text-[12px] text-warm-500">
          {mission.patient_name ? `Patient · ${mission.patient_name}` : 'Course privée'}
        </span>
      </div>

      <div className="px-5 pt-4 grid grid-cols-[1fr_auto] gap-4 items-end">
        <RouteTimeline from={{ name: mission.departure }} to={{ name: mission.destination }} />
        <div className="text-right">
          <div className="text-[32px] font-bold leading-none text-ink tabular-nums tracking-tight">
            {Number(mission.price_eur ?? 0)}<span className="text-[24px]">€</span>
          </div>
        </div>
      </div>

      <div className="px-5 pt-3 pb-4 flex items-center justify-between gap-3 text-[12px] text-warm-500">
        <span className="tabular-nums">
          {(mission.distance_km ?? 0).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} km
        </span>
        {isUrgent ? (
          <a
            href={wazeHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-ink text-paper text-[12px] font-semibold hover:bg-warm-800 transition-colors"
          >
            <Navigation2 className="w-3.5 h-3.5" strokeWidth={1.8} />
            Naviguer
          </a>
        ) : (
          <button
            type="button"
            onClick={() => onShowDetails(mission)}
            className="inline-flex items-center gap-1 h-9 px-4 rounded-lg border border-warm-300 text-ink text-[12px] font-semibold hover:bg-warm-50 transition-colors"
          >
            Voir détails
            <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.8} />
          </button>
        )}
      </div>
    </article>
  )
}

function MiniStat({
  label, value, hint, dark = false,
}: { label: string; value: string; hint: string; dark?: boolean }) {
  return (
    <div className={`rounded-2xl p-4 border ${dark ? 'bg-ink text-paper border-ink' : 'bg-paper border-warm-200 text-ink'}`}>
      <div className="flex items-center gap-1.5 mb-1.5">
        {dark && <span className="w-1.5 h-1.5 rounded-full bg-brand" />}
        <p className={`text-[12px] ${dark ? 'text-paper/70' : 'text-warm-500'}`}>{label}</p>
      </div>
      <p className={`text-[24px] font-bold leading-none mb-1 tabular-nums tracking-tight ${dark ? 'text-paper' : 'text-ink'}`}>
        {value}
      </p>
      <p className={`text-[11px] ${dark ? 'text-paper/60' : 'text-warm-500'} truncate`}>{hint}</p>
    </div>
  )
}
