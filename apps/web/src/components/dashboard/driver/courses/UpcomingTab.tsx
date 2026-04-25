'use client'
import { useUpcomingTab, type DayGroup } from './useUpcomingTab'
import { NextMissionHero } from './NextMissionHero'
import { UpcomingMissionCard } from './UpcomingMissionCard'
import type { Mission } from '@/lib/supabase/types'

export function UpcomingTab() {
  const t = useUpcomingTab()

  if (t.loading) {
    return (
      <ul className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-6">
        {[0, 1, 2].map((i) => (
          <li key={i} className="h-32 rounded-2xl bg-warm-100 motion-safe:animate-pulse" />
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

  const next = t.next ?? null
  const groups = t.groups
    .map((g) => ({ ...g, missions: next ? g.missions.filter((m) => m.id !== next.id) : g.missions }))
    .filter((g) => g.missions.length > 0)

  if (!next && groups.length === 0) {
    return (
      <div className="mt-6 rounded-2xl border border-warm-200 bg-paper p-10 text-center">
        <p className="text-[20px] font-bold leading-tight text-ink mb-2 tracking-tight">
          Aucune course prévue
        </p>
        <p className="text-sm text-warm-600">Vos courses à venir s&apos;afficheront ici.</p>
      </div>
    )
  }

  return (
    <div className="mt-4">
      {next && <NextMissionHero mission={next} />}
      {groups.map((g) => (
        <DaySection key={g.key} group={g} onShowDetails={t.openDetails} />
      ))}
    </div>
  )
}

function DaySection({
  group, onShowDetails,
}: { group: DayGroup; onShowDetails: (id: string) => void }) {
  const headerLabel = sectionLabel(group)
  return (
    <section className="mb-5">
      <header className="flex items-end justify-between mb-2 px-1">
        <h3 className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-warm-500">
          {headerLabel}
        </h3>
        <span className="text-[11px] text-warm-500 font-semibold tabular-nums">
          {group.missions.length} · {group.total}€
        </span>
      </header>
      <ul className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {group.missions.map((m: Mission) => (
          <li key={m.id}>
            <UpcomingMissionCard mission={m} onShowDetails={onShowDetails} />
          </li>
        ))}
      </ul>
    </section>
  )
}

function sectionLabel(g: DayGroup): string {
  // useUpcomingTab construit `g.label` au format "Aujourd'hui · 25 avril" / "Demain · 26 avril".
  // On en derive un titre uppercase plus court qui correspond a la maquette.
  if (g.label.startsWith("Aujourd'hui")) return "PLUS TARD AUJOURD'HUI"
  if (g.label.startsWith('Demain')) return 'DEMAIN'
  return g.label.toUpperCase()
}
