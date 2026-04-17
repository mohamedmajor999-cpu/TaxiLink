'use client'
import { OnlineDot } from '@/components/taxilink/OnlineDot'
import { CourseCard } from '@/components/taxilink/CourseCard'
import { useDriverHome, HOME_FILTERS, type HomeFilter } from './useDriverHome'

interface Props {
  onPostCourse: () => void
}

export function DriverHome({ onPostCourse }: Props) {
  const {
    driver, firstName, cards, counts, filter, setFilter,
    loading, error, acceptMission,
  } = useDriverHome()

  return (
    <div className="px-4 md:px-8 py-4 md:py-6 max-w-6xl mx-auto pb-24 md:pb-6">
      <header className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif text-display-md text-ink leading-tight">
            Bonjour {firstName} <span className="not-italic">👋</span>
          </h1>
          <p className="text-sm text-warm-600 mt-1">
            {counts.ALL} course{counts.ALL > 1 ? 's' : ''} disponible{counts.ALL > 1 ? 's' : ''} autour de vous
          </p>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-warm-200 text-xs font-semibold text-ink">
            <OnlineDot online={driver.isOnline} size="sm" />
            {driver.isOnline ? 'En ligne' : 'Hors ligne'}
          </span>
          <button
            type="button"
            onClick={onPostCourse}
            className="inline-flex items-center gap-1 h-9 px-4 rounded-lg bg-ink text-paper text-sm font-semibold hover:bg-warm-800 transition-colors"
          >
            + Poster
          </button>
        </div>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6" aria-label="Statistiques du jour">
        <StatCard
          label="Aujourd'hui"
          value={`${driver.todayEarnings ?? 0}€`}
          hint="Revenus du jour"
        />
        <StatCard
          label="Courses faites"
          value={String(driver.todayRides ?? 0)}
          hint="Sur la journée"
        />
        <StatCard
          label="Km parcourus"
          value={String(driver.todayKm ?? 0)}
          hint="Aujourd'hui"
        />
        <StatCard
          label="Cette semaine"
          value={`${(driver.todayEarnings ?? 0) * 7}€`}
          hint="Estimation"
        />
      </section>

      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0">
        {HOME_FILTERS.map((f) => (
          <FilterPill
            key={f.key}
            active={filter === f.key}
            count={counts[f.key]}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </FilterPill>
        ))}
      </div>

      {loading && <ListSkeleton />}
      {error && <ErrorState message={error} />}
      {!loading && !error && cards.length === 0 && <EmptyState onPostCourse={onPostCourse} />}

      {!loading && !error && cards.length > 0 && (
        <ul className="grid grid-cols-1 lg:grid-cols-2 gap-4" aria-label="Courses disponibles">
          {cards.map((c) => (
            <li key={c.id}>
              <CourseCard course={c} onAccept={acceptMission} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function StatCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="bg-paper border border-warm-200 rounded-2xl p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-warm-500 mb-1.5">
        {label}
      </p>
      <p className="font-serif text-[28px] leading-none text-ink mb-1">{value}</p>
      <p className="text-[11px] text-warm-500">{hint}</p>
    </div>
  )
}

function FilterPill({
  active, count, onClick, children,
}: {
  active: boolean
  count: number
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-semibold transition-colors ${active ? 'bg-ink text-paper' : 'bg-warm-100 text-ink hover:bg-warm-200'}`}
    >
      {children}
      <span className={active ? 'text-paper/70' : 'text-warm-500'}>{count}</span>
    </button>
  )
}

function ListSkeleton() {
  return (
    <ul className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {[0, 1, 2, 3].map((i) => (
        <li key={i} className="h-64 rounded-2xl bg-warm-100 motion-safe:animate-pulse" />
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
