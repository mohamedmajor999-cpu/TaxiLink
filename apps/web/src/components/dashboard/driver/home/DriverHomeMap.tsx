'use client'
import { Layers, LocateFixed, Maximize2, Minimize2 } from 'lucide-react'
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
  night?: boolean
  // Cache les controles natifs Leaflet (zoom +/-) sur mobile : utile quand
  // la sheet basse est deployee et passe par-dessus les controles.
  hideZoomControls?: boolean
}

export function DriverHomeMap({
  missions, userCoords, userAccuracy, selectedId, onSelect, className,
  fullscreen, onToggleFullscreen, night, hideZoomControls,
}: Props) {
  const { containerRef, recenter, mapRef, view, toggleView } = useDriverHomeMap({ userCoords, userAccuracy, night })
  useMissionMarkers({ mapRef, missions, selectedId, onSelect })
  return (
    <div className={`relative ${className ?? 'w-full h-full'} ${hideZoomControls ? 'hide-zoom-mobile' : ''}`}>
      <style>{`
        @media (max-width: 767px) {
          .hide-zoom-mobile .leaflet-control-zoom { display: none !important; }
        }
      `}</style>
      <div
        ref={containerRef}
        className="w-full h-full"
        aria-label="Carte des courses disponibles"
        role="application"
      />
      {/* Pile droite, du bas vers le haut : Localiser → Plein ecran → Satellite */}
      {userCoords && (
        <button
          type="button"
          onClick={recenter}
          aria-label="Recentrer sur ma position"
          className="absolute bottom-[22px] right-3 z-[500] w-11 h-11 rounded-full bg-white dark:bg-night-surface border border-warm-200 dark:border-night-border shadow-[0_4px_14px_rgba(0,0,0,0.2)] flex items-center justify-center text-ink dark:text-night-text hover:bg-warm-50 dark:hover:bg-night-elevated active:scale-95 transition-transform"
        >
          <LocateFixed className="w-5 h-5" strokeWidth={2} />
        </button>
      )}
      {onToggleFullscreen && (
        <button
          type="button"
          onClick={onToggleFullscreen}
          aria-label={fullscreen ? 'Quitter le plein écran' : 'Carte en plein écran'}
          className="md:hidden absolute bottom-[74px] right-3 z-[500] w-11 h-11 rounded-full bg-white dark:bg-night-surface border border-warm-200 dark:border-night-border shadow-[0_4px_14px_rgba(0,0,0,0.2)] flex items-center justify-center text-ink dark:text-night-text hover:bg-warm-50 dark:hover:bg-night-elevated active:scale-95 transition-transform"
        >
          {fullscreen
            ? <Minimize2 className="w-5 h-5" strokeWidth={2} />
            : <Maximize2 className="w-5 h-5" strokeWidth={2} />}
        </button>
      )}
      <button
        type="button"
        onClick={toggleView}
        aria-label={view === 'satellite' ? 'Vue plan' : 'Vue satellite'}
        aria-pressed={view === 'satellite'}
        className="absolute bottom-[126px] right-3 z-[500] w-11 h-11 rounded-full bg-white dark:bg-night-surface border border-warm-200 dark:border-night-border shadow-[0_4px_14px_rgba(0,0,0,0.2)] flex items-center justify-center text-ink dark:text-night-text hover:bg-warm-50 dark:hover:bg-night-elevated active:scale-95 transition-transform"
      >
        <Layers className="w-5 h-5" strokeWidth={view === 'satellite' ? 2.4 : 2} />
      </button>
    </div>
  )
}
