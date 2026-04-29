'use client'

import { useRef } from 'react'
import { useOnlineDriversMap } from './useOnlineDriversMap'

export function OnlineDriversMap() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { drivers, loading, error } = useOnlineDriversMap(containerRef)

  return (
    <section className="rounded-3xl bg-white p-5 shadow-soft md:p-6">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xl font-semibold text-secondary">Géolocalisation chauffeurs en ligne</h2>
        <div className="text-sm text-muted">
          {loading
            ? 'Chargement…'
            : <span><span className="font-semibold text-secondary">{drivers.length}</span> en ligne · maj toutes les 30s</span>}
        </div>
      </div>

      {error && <div className="mb-3 rounded-2xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="relative h-[480px] overflow-hidden rounded-2xl border border-line">
        <div ref={containerRef} className="absolute inset-0" aria-label="Carte des chauffeurs en ligne" />
        {!loading && drivers.length === 0 && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-bgsoft/70 text-sm text-muted">
            Aucun chauffeur en ligne avec position GPS active
          </div>
        )}
      </div>
    </section>
  )
}
