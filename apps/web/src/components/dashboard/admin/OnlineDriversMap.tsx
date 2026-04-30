'use client'

import { useRef } from 'react'
import { useOnlineDriversMap } from './useOnlineDriversMap'
import { SectionShell } from './ui/SectionShell'

export function OnlineDriversMap() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { drivers, loading, error } = useOnlineDriversMap(containerRef)

  const right = (
    <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 ring-1 ring-emerald-200">
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
      </span>
      <span className="text-xs font-semibold text-emerald-700">
        {loading ? 'Chargement…' : `${drivers.length} en ligne`}
      </span>
      <span className="text-[10px] text-emerald-600/70">· maj 30s</span>
    </div>
  )

  return (
    <SectionShell
      title="Carte temps réel"
      subtitle="Chauffeurs avec position GPS active (&lt; 5 min)"
      icon={<span className="text-lg">🗺️</span>}
      iconBg="bg-emerald-100 text-emerald-700"
      right={right}
    >
      {error && <div className="mb-3 rounded-2xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="relative h-[480px] overflow-hidden rounded-2xl ring-1 ring-line">
        <div ref={containerRef} className="absolute inset-0" aria-label="Carte des chauffeurs en ligne" />
        {!loading && drivers.length === 0 && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-bgsoft/70 text-sm text-muted">
            Aucun chauffeur en ligne avec position GPS active
          </div>
        )}
      </div>
    </SectionShell>
  )
}
