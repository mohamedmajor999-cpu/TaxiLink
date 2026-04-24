'use client'
import { LocateFixed } from 'lucide-react'
import type { Mission } from '@/lib/supabase/types'
import { useDriverHomeMap } from './useDriverHomeMap'

interface Props {
  missions: Mission[]
  userCoords: { lat: number; lng: number } | null
  userAccuracy: number | null
  selectedId: string | null
  onSelect: (id: string) => void
  className?: string
}

export function DriverHomeMap({ missions, userCoords, userAccuracy, selectedId, onSelect, className }: Props) {
  const { containerRef, recenter } = useDriverHomeMap({ missions, userCoords, userAccuracy, selectedId, onSelect })
  return (
    <div className={`relative ${className ?? 'w-full h-full'}`}>
      <div
        ref={containerRef}
        className="w-full h-full"
        aria-label="Carte des courses disponibles"
        role="application"
      />
      {userCoords && (
        <button
          type="button"
          onClick={recenter}
          aria-label="Recentrer sur ma position"
          className="absolute bottom-8 right-3 z-[500] w-11 h-11 rounded-full bg-white border border-warm-200 shadow-[0_4px_14px_rgba(0,0,0,0.2)] flex items-center justify-center text-ink hover:bg-warm-50 active:scale-95 transition-transform"
        >
          <LocateFixed className="w-5 h-5" strokeWidth={2} />
        </button>
      )}
    </div>
  )
}
