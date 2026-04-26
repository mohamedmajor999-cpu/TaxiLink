'use client'
import { useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { List, CalendarRange } from 'lucide-react'
import { useUpcomingTab, type DayGroup } from './useUpcomingTab'
import { NextMissionHero } from './NextMissionHero'
import { UpcomingMissionCard } from './UpcomingMissionCard'
import { AgendaTab } from './AgendaTab'
import { CoursesEmptyOnboarding } from './CoursesEmptyOnboarding'
import type { Mission } from '@/lib/supabase/types'

type ViewMode = 'list' | 'week'

export function UpcomingTab() {
  const [viewMode, setViewMode] = useState<ViewMode>('list')

  return (
    <div>
      <ViewToggle mode={viewMode} onChange={setViewMode} />
      {viewMode === 'list' ? <UpcomingListView /> : <AgendaTab />}
    </div>
  )
}

function ViewToggle({ mode, onChange }: { mode: ViewMode; onChange: (m: ViewMode) => void }) {
  const base = 'inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-[12px] font-bold transition-colors border'
  return (
    <div className="flex gap-1.5 mb-3">
      <button
        type="button"
        onClick={() => onChange('list')}
        aria-pressed={mode === 'list'}
        className={`${base} ${mode === 'list' ? 'bg-ink text-paper border-ink' : 'bg-paper text-ink border-warm-200'}`}
      >
        <List className="w-3.5 h-3.5" strokeWidth={2} />
        Liste
      </button>
      <button
        type="button"
        onClick={() => onChange('week')}
        aria-pressed={mode === 'week'}
        className={`${base} ${mode === 'week' ? 'bg-ink text-paper border-ink' : 'bg-paper text-ink border-warm-200'}`}
      >
        <CalendarRange className="w-3.5 h-3.5" strokeWidth={2} />
        Semaine
      </button>
    </div>
  )
}

function UpcomingListView() {
  const t = useUpcomingTab()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const openCreer = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('creer', '1')
    router.push(`${pathname}?${params.toString()}`)
  }

  if (t.loading) {
    return (
      <ul className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {[0, 1, 2].map((i) => (
          <li key={i} className="h-32 rounded-2xl bg-warm-100 motion-safe:animate-pulse" />
        ))}
      </ul>
    )
  }
  if (t.error) {
    return (
      <div className="rounded-2xl border border-danger/30 bg-danger-soft p-5 text-sm text-danger">
        {t.error}
      </div>
    )
  }

  const next = t.next ?? null
  const groups = t.groups
    .map((g) => ({ ...g, missions: next ? g.missions.filter((m) => m.id !== next.id) : g.missions }))
    .filter((g) => g.missions.length > 0)

  if (!next && groups.length === 0) {
    return <CoursesEmptyOnboarding onPostCourse={openCreer} />
  }

  return (
    <div>
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
  if (g.label.startsWith("Aujourd'hui")) return "PLUS TARD AUJOURD'HUI"
  if (g.label.startsWith('Demain')) return 'DEMAIN'
  return g.label.toUpperCase()
}
