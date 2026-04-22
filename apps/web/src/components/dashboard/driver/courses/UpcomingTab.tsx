'use client'
import { ChevronRight, Navigation2 } from 'lucide-react'
import { RideBadge } from '@/components/taxilink/RideBadge'
import { useUpcomingTab, type DayGroup } from './useUpcomingTab'
import type { Mission } from '@/lib/supabase/types'
import { formatMissionPrice } from '@/lib/formatMissionPrice'

export function UpcomingTab() {
  const t = useUpcomingTab()

  if (t.loading) {
    return (
      <ul className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-6">
        {[0, 1, 2].map((i) => (
          <li key={i} className="h-20 rounded-xl bg-warm-100 motion-safe:animate-pulse" />
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
      <section className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
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
    </div>
  )
}

function DaySection({
  group, onShowDetails,
}: { group: DayGroup; onShowDetails: (id: string) => void }) {
  return (
    <section className="mb-6">
      <header className="flex items-end justify-between mb-2">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-warm-500">
          {group.label}
        </h3>
        <span className="text-[11px] text-warm-500">
          {group.missions.length} course{group.missions.length > 1 ? 's' : ''} · {group.total}€
        </span>
      </header>
      <ul className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        {group.missions.map((m) => (
          <li key={m.id}>
            <CompactMissionCard mission={m} onShowDetails={onShowDetails} />
          </li>
        ))}
      </ul>
    </section>
  )
}

function CompactMissionCard({
  mission, onShowDetails,
}: { mission: Mission; onShowDetails: (id: string) => void }) {
  const d = new Date(mission.scheduled_at)
  const timeLabel = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  const badgeVariant = mission.type === 'CPAM'
    ? 'medical' as const
    : mission.type === 'PRIVE'
      ? 'private' as const
      : 'fleet' as const
  const badgeLabel = mission.type === 'CPAM' ? 'Médical' : mission.type === 'PRIVE' ? 'Privé' : 'TaxiLink'
  const isUrgent = mission.type === 'CPAM'
  const wazeHref = `https://waze.com/ul?q=${encodeURIComponent(mission.destination)}&navigate=yes`
  const routeLabel = `${mission.departure} → ${mission.destination}`

  return (
    <article className="bg-paper border border-warm-200 rounded-xl px-4 py-3 flex items-center gap-3 shadow-soft min-h-[80px]">
      <div className="flex flex-col items-start gap-1 shrink-0">
        <RideBadge variant={badgeVariant}>{badgeLabel}</RideBadge>
        <span className="text-[12px] font-semibold text-ink tabular-nums">{timeLabel}</span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-ink truncate leading-tight">{routeLabel}</p>
        {mission.patient_name && (
          <p className="text-[11px] text-warm-500 truncate mt-0.5">{mission.patient_name}</p>
        )}
      </div>

      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <span className="text-[18px] font-bold text-ink tabular-nums tracking-tight leading-none">
          {formatMissionPrice(mission)}
        </span>
        {isUrgent ? (
          <a
            href={wazeHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 h-7 px-3 rounded-lg bg-ink text-paper text-[11px] font-semibold hover:bg-warm-800 transition-colors"
          >
            <Navigation2 className="w-3 h-3" strokeWidth={1.8} />
            Naviguer
          </a>
        ) : (
          <button
            type="button"
            onClick={() => onShowDetails(mission.id)}
            className="inline-flex items-center gap-0.5 h-7 px-2.5 rounded-lg border border-warm-300 text-ink text-[11px] font-semibold hover:bg-warm-50 transition-colors"
          >
            Détails
            <ChevronRight className="w-3 h-3" strokeWidth={2} />
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
    <div className={`rounded-xl p-3 border ${dark ? 'bg-ink text-paper border-ink' : 'bg-paper border-warm-200 text-ink'}`}>
      <div className="flex items-center gap-1.5 mb-1">
        {dark && <span className="w-1.5 h-1.5 rounded-full bg-brand" />}
        <p className={`text-[11px] ${dark ? 'text-paper/70' : 'text-warm-500'}`}>{label}</p>
      </div>
      <p className={`text-[20px] font-bold leading-none mb-1 tabular-nums tracking-tight ${dark ? 'text-paper' : 'text-ink'}`}>
        {value}
      </p>
      <p className={`text-[11px] ${dark ? 'text-paper/60' : 'text-warm-500'} truncate`}>{hint}</p>
    </div>
  )
}
