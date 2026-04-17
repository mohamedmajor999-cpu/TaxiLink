'use client'
import { Filter } from 'lucide-react'
import { CourseCard } from '@/components/taxilink/CourseCard'
import {
  useDriverHome,
  HOME_TYPE_FILTERS,
  HOME_GROUP_FILTERS,
} from './useDriverHome'
import { HomeMobileHeader } from './home/HomeMobileHeader'

interface Props {
  onPostCourse: () => void
}

export function DriverHome({ onPostCourse }: Props) {
  const h = useDriverHome()

  return (
    <div className="px-4 md:px-8 py-4 md:py-6 max-w-2xl mx-auto pb-24 md:pb-6">
      <HomeMobileHeader
        city={h.city}
        postalCode={h.postalCode}
        isOnline={h.driver.isOnline}
        onToggleOnline={() => h.setOnline(!h.driver.isOnline)}
        initials={h.initials}
      />

      <section className="grid grid-cols-3 gap-3 mb-6" aria-label="Statistiques du jour">
        <StatCard
          active
          label="Aujourd'hui"
          value={`${h.driver.todayEarnings ?? 0}€`}
        />
        <StatCard label="Courses" value={String(h.driver.todayRides ?? 0)} />
        <StatCard label="Km" value={String(h.driver.todayKm ?? 0)} />
      </section>

      <header className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="font-serif text-display-sm text-ink leading-tight">Courses dispo</h2>
          <p className="text-xs text-warm-500 mt-1">
            {h.counts.ALL} à proximité · {h.nearbyZone}
          </p>
        </div>
        <button
          type="button"
          aria-label="Filtres"
          className="w-10 h-10 rounded-full border border-warm-200 bg-paper flex items-center justify-center text-ink hover:bg-warm-50 transition-colors"
        >
          <Filter className="w-4 h-4" strokeWidth={1.8} />
        </button>
      </header>

      <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0">
        {HOME_TYPE_FILTERS.map((f) => (
          <TypePill
            key={f.key}
            active={h.filter === f.key}
            label={`${f.label} (${h.counts[f.key]})`}
            onClick={() => h.setFilter(f.key)}
          />
        ))}
      </div>

      <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0">
        {HOME_GROUP_FILTERS.map((g) => (
          <GroupPill
            key={g.key}
            active={h.group === g.key}
            label={g.label}
            onClick={() => h.setGroup(g.key)}
          />
        ))}
      </div>

      {h.loading && <ListSkeleton />}
      {h.error && <ErrorState message={h.error} />}
      {!h.loading && !h.error && h.cards.length === 0 && (
        <EmptyState onPostCourse={onPostCourse} />
      )}

      {!h.loading && !h.error && h.cards.length > 0 && (
        <ul className="flex flex-col gap-4" aria-label="Courses disponibles">
          {h.cards.map((c) => (
            <li key={c.id}>
              <CourseCard course={c} onAccept={h.acceptMission} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function StatCard({ label, value, active = false }: { label: string; value: string; active?: boolean }) {
  return (
    <div
      className={`bg-paper rounded-2xl px-3 py-3 ${active ? 'border-2 border-ink' : 'border border-warm-200'}`}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        {active && <span className="w-1.5 h-1.5 rounded-full bg-brand" />}
        <span className="text-[11px] text-warm-500">{label}</span>
      </div>
      <p className="font-serif text-[22px] leading-none text-ink">{value}</p>
    </div>
  )
}

function TypePill({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 inline-flex items-center h-9 px-4 rounded-full text-[13px] font-semibold transition-colors ${
        active
          ? 'bg-ink text-paper'
          : 'bg-paper text-ink border border-warm-200 hover:bg-warm-50'
      }`}
    >
      {label}
    </button>
  )
}

function GroupPill({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-[11px] font-semibold transition-colors ${
        active
          ? 'bg-ink text-paper'
          : 'bg-paper text-warm-600 border border-warm-200 hover:bg-warm-50'
      }`}
    >
      {active && <span className="w-1.5 h-1.5 rounded-full bg-brand" />}
      {label}
    </button>
  )
}

function ListSkeleton() {
  return (
    <ul className="flex flex-col gap-4">
      {[0, 1, 2].map((i) => (
        <li key={i} className="h-56 rounded-2xl bg-warm-100 motion-safe:animate-pulse" />
      ))}
    </ul>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-danger/30 bg-danger-soft p-5 text-sm text-danger">
      {message}
    </div>
  )
}

function EmptyState({ onPostCourse }: { onPostCourse: () => void }) {
  return (
    <div className="rounded-2xl border border-warm-200 bg-paper p-10 text-center">
      <p className="font-serif text-display-sm text-ink mb-2">Aucune course disponible</p>
      <p className="text-sm text-warm-600 mb-5">
        Aucune course dans vos groupes pour l&apos;instant.
      </p>
      <button
        type="button"
        onClick={onPostCourse}
        className="inline-flex items-center h-10 px-5 rounded-lg bg-ink text-paper text-sm font-semibold"
      >
        Poster une course
      </button>
    </div>
  )
}
