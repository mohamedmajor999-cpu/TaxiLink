'use client'
import { useEffect, useRef, useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { usePatronFleetMap, type TileMode } from './usePatronFleetMap'
import type { PatronFleetMember } from '@/services/patronFleetService'

interface Props {
  fleet: PatronFleetMember[]
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ''
const STATIC_PARIS = '2.35,48.85,11/120x120'
const SAT_THUMB = MAPBOX_TOKEN
  ? `url(https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${STATIC_PARIS}@2x?access_token=${MAPBOX_TOKEN})`
  : 'linear-gradient(135deg,#3b5e3b,#1f3a1f)'
const STREET_THUMB = MAPBOX_TOKEN
  ? `url(https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${STATIC_PARIS}@2x?access_token=${MAPBOX_TOKEN})`
  : 'linear-gradient(135deg,#e0e0e0,#bdbdbd)'

export function PatronFleetMap({ fleet }: Props) {
  const sectionRef = useRef<HTMLElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [tileMode, setTileMode] = useState<TileMode>('street')
  const [fullscreen, setFullscreen] = useState(false)
  const { zoomIn, zoomOut, invalidateSize } = usePatronFleetMap(containerRef, fleet, tileMode)
  const positioned = fleet.filter((d) => d.lat != null && d.lng != null)
  const thumbBg = tileMode === 'street' ? SAT_THUMB : STREET_THUMB
  const thumbLabel = tileMode === 'street' ? 'Satellite' : 'Plan'

  useEffect(() => {
    const onChange = () => {
      const isFs = document.fullscreenElement === sectionRef.current
      setFullscreen(isFs)
      setTimeout(() => invalidateSize(), 220)
    }
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [invalidateSize])

  const toggleFullscreen = async () => {
    if (!sectionRef.current) return
    try {
      if (!document.fullscreenElement) {
        await sectionRef.current.requestFullscreen()
      } else {
        await document.exitFullscreen()
      }
    } catch {
      /* l'utilisateur a refusé ou navigateur sans support */
    }
  }

  return (
    <section
      ref={sectionRef}
      className={`bg-paper dark:bg-night-surface ${fullscreen ? '' : 'rounded-2xl overflow-hidden border border-warm-200 dark:border-night-border'}`}
    >
      <div className={`relative ${fullscreen ? 'w-screen h-screen' : 'h-[420px]'}`}>
        <div ref={containerRef} className="absolute inset-0" aria-label="Carte des chauffeurs de la flotte" />

        {/* Top-left info pill */}
        <div className="absolute top-3 left-3 z-[1000] bg-paper/95 dark:bg-night-surface/95 backdrop-blur-sm rounded-xl shadow-md border border-warm-200 dark:border-night-border px-3 py-2 max-w-[260px]">
          <p className="text-sm font-bold text-ink dark:text-night-text">Carte de la flotte</p>
          <p className="text-[11px] text-warm-600 dark:text-night-text-soft tabular-nums">
            {positioned.length} chauffeur{positioned.length > 1 ? 's' : ''} géolocalisé{positioned.length > 1 ? 's' : ''}
          </p>
        </div>

        {/* Top-right fullscreen toggle */}
        <button
          type="button"
          onClick={toggleFullscreen}
          title={fullscreen ? 'Quitter plein écran (Échap)' : 'Plein écran'}
          aria-label={fullscreen ? 'Quitter plein écran' : 'Plein écran'}
          className="absolute top-3 right-3 z-[1000] h-10 w-10 rounded-xl bg-paper/95 dark:bg-night-surface/95 backdrop-blur-sm shadow-md border border-warm-200 dark:border-night-border text-ink dark:text-night-text hover:bg-warm-100 dark:hover:bg-night-elevated flex items-center justify-center"
        >
          <Icon name={fullscreen ? 'fullscreen_exit' : 'fullscreen'} size={20} />
        </button>

        {/* Bottom-right zoom stack */}
        <div className="absolute bottom-6 right-3 z-[1000] flex flex-col rounded-xl overflow-hidden bg-paper/95 dark:bg-night-surface/95 backdrop-blur-sm shadow-md border border-warm-200 dark:border-night-border">
          <button type="button" onClick={zoomIn} title="Zoom +" aria-label="Zoom +" className="h-10 w-10 text-ink dark:text-night-text hover:bg-warm-100 dark:hover:bg-night-elevated flex items-center justify-center border-b border-warm-200 dark:border-night-border">
            <Icon name="add" size={20} />
          </button>
          <button type="button" onClick={zoomOut} title="Zoom -" aria-label="Zoom -" className="h-10 w-10 text-ink dark:text-night-text hover:bg-warm-100 dark:hover:bg-night-elevated flex items-center justify-center">
            <Icon name="remove" size={20} />
          </button>
        </div>

        {/* Bottom-left satellite/street thumbnail toggle */}
        <button
          type="button"
          onClick={() => setTileMode((m) => (m === 'street' ? 'satellite' : 'street'))}
          title={`Vue ${thumbLabel}`}
          aria-label={`Vue ${thumbLabel}`}
          className="absolute bottom-6 left-3 z-[1000] w-[70px] h-[70px] rounded-xl overflow-hidden shadow-md border-2 border-paper dark:border-night-surface hover:border-ink dark:hover:border-night-brand transition-colors flex flex-col items-end justify-end p-1.5 bg-cover bg-center"
          style={{ backgroundImage: thumbBg }}
        >
          <span className="text-[10px] font-bold text-paper bg-ink/70 px-1.5 py-0.5 rounded">
            {thumbLabel}
          </span>
        </button>

        {positioned.length === 0 && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-paper/70 dark:bg-night-surface/70 text-sm text-warm-600 dark:text-night-text-soft">
            Aucun chauffeur avec position GPS active
          </div>
        )}
      </div>
    </section>
  )
}
