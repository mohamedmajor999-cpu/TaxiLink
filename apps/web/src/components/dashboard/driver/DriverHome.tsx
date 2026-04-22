'use client'
import { CourseCard } from '@/components/taxilink/CourseCard'
import { NotificationPermissionBanner } from '@/components/taxilink/NotificationPermissionBanner'
import { useDriverHome, HOME_TYPE_FILTERS, HOME_SORT_OPTIONS, type HomeSort } from './useDriverHome'
import { HomeMobileHeader } from './home/HomeMobileHeader'
import { HomeGroupFilterBar } from './home/HomeGroupFilterBar'
import { NextMissionBanner } from './NextMissionBanner'

interface Props {
  onPostCourse: () => void
  onShowCurrentCourse: () => void
}

export function DriverHome({ onPostCourse, onShowCurrentCourse }: Props) {
  const h = useDriverHome()

  const onSortChange = (v: HomeSort) => {
    h.setSort(v)
    if (v === 'nearest' && !h.hasUserCoords) h.requestLocation()
  }

  return (
    <div className="px-4 md:px-8 py-4 md:py-6 max-w-2xl md:max-w-5xl mx-auto pb-24 md:pb-6">
      <HomeMobileHeader
        city={h.city}
        postalCode={h.postalCode}
        isOnline={h.driver.isOnline}
        onToggleOnline={() => h.setOnline(!h.driver.isOnline)}
        initials={h.initials}
      />

      <TodaySummary
        earnings={h.driver.todayEarnings ?? 0}
        rides={h.driver.todayRides ?? 0}
        km={h.driver.todayKm ?? 0}
      />

      {h.currentMission && h.notificationPermission === 'default' && (
        <NotificationPermissionBanner onActivate={() => { void h.requestNotificationPermission() }} />
      )}

      {h.currentMission && (
        <NextMissionBanner
          mission={h.currentMission}
          onShowDetail={onShowCurrentCourse}
          onComplete={h.completeMission}
          userCoords={h.userCoords}
        />
      )}

      <header className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h2 className="text-[22px] font-bold text-ink leading-tight tracking-tight">
            Courses dispo
          </h2>
          <p className="text-[13px] text-warm-500 mt-1">
            {h.scopeCount} disponible{h.scopeCount > 1 ? 's' : ''}
            {h.scopeLabel && <> · <span className="text-ink/70">{h.scopeLabel}</span></>}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <SortSelect value={h.sort} onChange={onSortChange} />
        </div>
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

      <HomeGroupFilterBar
        groups={h.groups}
        selected={h.selectedGroupId}
        onSelect={h.setSelectedGroupId}
      />

      {h.loading && <ListSkeleton />}
      {h.error && <ErrorState message={h.error} />}
      {!h.loading && !h.error && h.cards.length === 0 && (
        <EmptyState onPostCourse={onPostCourse} />
      )}

      {!h.loading && !h.error && h.cards.length > 0 && (
        <ul className="grid grid-cols-1 lg:grid-cols-2 gap-4" aria-label="Courses disponibles">
          {h.cards.map((c) => (
            <li key={c.id} className="h-full">
              <CourseCard course={c} onAccept={h.acceptMission} onShowDetail={onShowCurrentCourse} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function TodaySummary({ earnings, rides, km }: { earnings: number; rides: number; km: number }) {
  return (
    <div className="mb-5 text-[13px] text-warm-600 tabular-nums">
      <span className="font-semibold text-ink">{earnings}€</span>
      <span className="mx-1.5 text-warm-400">·</span>
      <span>{rides} {rides > 1 ? 'courses' : 'course'}</span>
      <span className="mx-1.5 text-warm-400">·</span>
      <span>{km} km</span>
      <span className="mx-1.5 text-warm-400">·</span>
      <span className="text-warm-500">aujourd&apos;hui</span>
    </div>
  )
}

function SortSelect({ value, onChange }: { value: HomeSort; onChange: (v: HomeSort) => void }) {
  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">Trier les courses</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as HomeSort)}
        className="h-10 pl-3 pr-8 rounded-full border border-warm-200 bg-paper text-[13px] font-semibold text-ink appearance-none cursor-pointer hover:bg-warm-50"
      >
        {HOME_SORT_OPTIONS.map((o) => (
          <option key={o.key} value={o.key}>{o.label}</option>
        ))}
      </select>
      <svg
        aria-hidden="true"
        className="absolute right-2.5 w-3 h-3 text-warm-500 pointer-events-none"
        viewBox="0 0 12 12" fill="none"
      >
        <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </label>
  )
}

function TypePill({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 inline-flex items-center h-10 px-5 rounded-full text-[14px] font-semibold transition-colors ${
        active ? 'bg-ink text-paper' : 'bg-paper text-ink border border-warm-200 hover:bg-warm-50'
      }`}
    >
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
      <p className="text-[20px] font-bold leading-tight text-ink mb-2 tracking-tight">
        Aucune course disponible
      </p>
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
