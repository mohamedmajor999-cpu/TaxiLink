'use client'
import { LocateFixed, Maximize2, Minimize2 } from 'lucide-react'
import type { Mission } from '@/lib/supabase/types'
import { useDriverHomeMap } from './useDriverHomeMap'
import { useMissionMarkers } from './useMissionMarkers'

interface Props {
  missions: Mission[]
  userCoords: { lat: number; lng: number } | null
  userAccuracy: number | null
  selectedId: string | null
  onSelect: (id: string) => void
  className?: string
  fullscreen?: boolean
  onToggleFullscreen?: () => void
}

export function DriverHomeMap({
  missions, userCoords, userAccuracy, selectedId, onSelect, className,
  fullscreen, onToggleFullscreen,
}: Props) {
  const { containerRef, recenter, mapRef } = useDriverHomeMap({ userCoords, userAccuracy })
  useMissionMarkers({ mapRef, missions, selectedId, onSelect })
  return (
    <div className={`relative ${className ?? 'w-full h-full'}`}>
      <div
        ref={containerRef}
        className="w-full h-full"
        aria-label="Carte des courses disponibles"
        role="application"
      />
      {onToggleFullscreen && (
        <button
          type="button"
          onClick={onToggleFullscreen}
          aria-label={fullscreen ? 'Quitter le plein écran' : 'Carte en plein écran'}
          className="md:hidden absolute bottom-[76px] right-3 z-[500] w-11 h-11 rounded-full bg-white border border-warm-200 shadow-[0_4px_14px_rgba(0,0,0,0.2)] flex items-center justify-center text-ink hover:bg-warm-50 active:scale-95 transition-transform"
        >
          {fullscreen
            ? <Minimize2 className="w-5 h-5" strokeWidth={2} />
            : <Maximize2 className="w-5 h-5" strokeWidth={2} />}
        </button>
      )}
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
