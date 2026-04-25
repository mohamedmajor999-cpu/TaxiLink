'use client'
import { useEffect, useRef } from 'react'
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
}

export function DriverHomeSheet({
  missions, selectedId, userCoords, filter, counts,
  urgentOnly, nearbyOnly, hasUserCoords,
  onSelect, onFilterChange, onUrgentToggle, onNearbyToggle,
  onPostCourse, scopeLabel, loading, banner, snap, onSnapChange,
}: Props) {
  const listRef = useRef<HTMLDivElement | null>(null)
  const dragHandleRef = useSheetDrag(snap, onSnapChange)
  const isCollapsed = snap === 'one'
  useEffect(() => {
    if (!selectedId || !listRef.current) return
    const el = listRef.current.querySelector<HTMLElement>(`[data-mission="${selectedId}"]`)
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [selectedId])

  return (
    <section
      className="bg-paper rounded-t-[24px] shadow-[0_-8px_30px_rgba(0,0,0,0.08)] flex flex-col min-h-0 flex-1"
      aria-label="Liste des courses disponibles"
    >
      <div
        ref={dragHandleRef}
        className="md:hidden h-9 flex items-center justify-center touch-none cursor-grab active:cursor-grabbing select-none"
        role="slider"
        aria-label="Redimensionner la feuille"
        aria-valuemin={1}
        aria-valuemax={4}
        aria-valuenow={snap === 'one' ? 1 : snap === 'two' ? 2 : snap === 'three' ? 3 : 4}
        style={{ touchAction: 'none' }}
      >
        <span className="w-16 h-2 rounded-full bg-warm-700" />
      </div>
      <div className="hidden md:block pt-4" />
      <div className={isCollapsed ? 'hidden md:block' : 'block'}>
        <header className="px-5 pb-2.5 flex items-center justify-between">
          <h2 className="text-[15px] font-extrabold text-ink">Annonces autour de vous</h2>
          <span className="text-[12px] text-warm-500 font-semibold">
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
        {banner && <div className="mb-2">{banner}</div>}
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
        <div key={i} className="h-[96px] rounded-2xl bg-warm-100 motion-safe:animate-pulse" />
      ))}
    </div>
  )
}

function SheetEmpty({ onPostCourse }: { onPostCourse: () => void }) {
  return (
    <div className="text-center py-10 px-4">
      <p className="text-[15px] font-extrabold text-ink mb-1">Aucune annonce autour de vous</p>
      <p className="text-[12.5px] text-warm-500 mb-4">Aucune course ne correspond à vos filtres.</p>
      <button
        type="button"
        onClick={onPostCourse}
        className="inline-flex items-center gap-1.5 h-10 px-5 rounded-lg bg-ink text-paper text-[13px] font-semibold"
      >
        Poster une course
      </button>
    </div>
  )
}
