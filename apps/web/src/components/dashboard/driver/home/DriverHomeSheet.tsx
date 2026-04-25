'use client'
import { useEffect, useRef, type RefObject } from 'react'
import type { ReactNode } from 'react'
import type { Mission } from '@/lib/supabase/types'
import { type HomeTypeFilter } from './useDriverHomeFilters'
import { MissionSheetItem } from './MissionSheetItem'
import { DriverHomeFilterChips } from './DriverHomeFilterChips'
import { useSheetDrag, type SheetSnap } from './useSheetDrag'

interface Props {
  missions: Mission[]
  selectedId: string | null
  userCoords: { lat: number; lng: number } | null
  filter: HomeTypeFilter
  counts: Record<HomeTypeFilter, number>
  urgentOnly: boolean
  nearbyOnly: boolean
  hasUserCoords: boolean
  onSelect: (id: string) => void
  onFilterChange: (key: HomeTypeFilter) => void
  onUrgentToggle: () => void
  onNearbyToggle: () => void
  onPostCourse: () => void
  scopeLabel: string
  loading: boolean
  banner?: ReactNode
  snap: SheetSnap
  onSnapChange: (s: SheetSnap) => void
  sheetRef: RefObject<HTMLDivElement | null>
  vh: number
}

export function DriverHomeSheet({
  missions, selectedId, userCoords, filter, counts,
  urgentOnly, nearbyOnly, hasUserCoords,
  onSelect, onFilterChange, onUrgentToggle, onNearbyToggle,
  onPostCourse, scopeLabel, loading, banner, snap, onSnapChange,
  sheetRef, vh,
}: Props) {
  const listRef = useRef<HTMLDivElement | null>(null)
  const dragHandleRef = useSheetDrag(snap, onSnapChange, sheetRef, vh)
  const isCollapsed = snap === 'one'
  useEffect(() => {
    if (!selectedId || !listRef.current) return
    const el = listRef.current.querySelector<HTMLElement>(`[data-mission="${selectedId}"]`)
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [selectedId])

  return (
    <section
      className="bg-paper dark:bg-night-bg rounded-t-[24px] shadow-[0_-8px_30px_rgba(0,0,0,0.08)] flex flex-col min-h-0 flex-1"
      aria-label="Liste des courses disponibles"
    >
      <div
        ref={dragHandleRef}
        className="md:hidden h-10 flex items-center justify-center touch-none cursor-grab active:cursor-grabbing select-none"
        role="slider"
        aria-label="Redimensionner la feuille"
        aria-valuemin={1}
        aria-valuemax={4}
        aria-valuenow={snap === 'one' ? 1 : snap === 'two' ? 2 : snap === 'three' ? 3 : 4}
        style={{ touchAction: 'none' }}
      >
        <span className="w-14 h-1.5 rounded-full bg-warm-500 dark:bg-night-text-soft" />
      </div>
      <div className="hidden md:block pt-4" />
      <div className={isCollapsed ? 'hidden md:block' : 'block'}>
        <header className="px-5 pb-2.5 flex items-center justify-between">
          <h2 className="text-[15px] font-extrabold text-ink dark:text-night-text">Annonces autour de vous</h2>
          <span className="text-[12px] text-warm-500 dark:text-night-text-soft font-semibold">
            {missions.length} · {scopeLabel}
          </span>
        </header>
        <DriverHomeFilterChips
          filter={filter}
          counts={counts}
          urgentOnly={urgentOnly}
          nearbyOnly={nearbyOnly}
          hasUserCoords={hasUserCoords}
          onFilterChange={onFilterChange}
          onUrgentToggle={onUrgentToggle}
          onNearbyToggle={onNearbyToggle}
        />
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto px-4 pb-3 hide-scrollbar space-y-2">
        {banner}
        {loading && <SheetSkeleton />}
        {!loading && missions.length === 0 && <SheetEmpty onPostCourse={onPostCourse} />}
        {!loading && missions.map((m) => (
          <MissionSheetItem
            key={m.id}
            mission={m}
            selected={m.id === selectedId}
            userCoords={userCoords}
            onSelect={onSelect}
          />
        ))}
      </div>
    </section>
  )
}

function SheetSkeleton() {
  return (
    <div className="space-y-2">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-[96px] rounded-2xl bg-warm-100 dark:bg-night-surface motion-safe:animate-pulse" />
      ))}
    </div>
  )
}

function SheetEmpty({ onPostCourse }: { onPostCourse: () => void }) {
  return (
    <div className="text-center py-10 px-4">
      <p className="text-[15px] font-extrabold text-ink dark:text-night-text mb-1">Aucune annonce autour de vous</p>
      <p className="text-[12.5px] text-warm-500 dark:text-night-text-soft mb-4">Aucune course ne correspond à vos filtres.</p>
      <button
        type="button"
        onClick={onPostCourse}
        className="inline-flex items-center gap-1.5 h-10 px-5 rounded-lg bg-ink dark:bg-night-brand text-paper dark:text-night-bg text-[13px] font-semibold"
      >
        Poster une course
      </button>
    </div>
  )
}
