'use client'

import { useMissionsSection } from './useMissionsSection'
import { SectionShell } from './ui/SectionShell'

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
// Jaune TaxiLink primary (#FFD23F) pour intensite, dégradé sur fond bgsoft.
const HEAT_RGB = '255, 210, 63'

export function HeatmapSection() {
  const { report, loading, error } = useMissionsSection()

  return (
    <SectionShell
      title="Heatmap des heures de pointe"
      subtitle="Volume de courses postées par jour de la semaine et heure (UTC)"
      iconName="grid_view"
    >
      {loading && <div className="h-48 animate-pulse rounded-2xl bg-bgsoft" />}
      {error && <div className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}

      {report && (() => {
        const grid = report.heatmap
        const max = Math.max(...grid.flat(), 1)

        return (
          <div className="space-y-2 overflow-x-auto">
            <div className="flex items-center gap-2">
              <div className="w-10" />
              <div
                className="flex-1 grid gap-1 text-[9px] text-muted"
                style={{ gridTemplateColumns: 'repeat(24, minmax(0, 1fr))' }}
              >
                {Array.from({ length: 24 }, (_, h) => (
                  <div key={h} className="text-center">{h % 3 === 0 ? `${h}h` : ''}</div>
                ))}
              </div>
            </div>

            {grid.map((row, dow) => (
              <div key={dow} className="flex items-center gap-2">
                <div className="w-10 text-xs font-medium text-muted">{DAYS[dow]}</div>
                <div className="flex-1 grid gap-1" style={{ gridTemplateColumns: 'repeat(24, minmax(0, 1fr))' }}>
                  {row.map((v, h) => {
                    const intensity = v / max
                    return (
                      <div
                        key={h}
                        title={`${DAYS[dow]} ${h}h : ${v} course${v > 1 ? 's' : ''}`}
                        className="aspect-square rounded transition hover:ring-2 hover:ring-secondary"
                        style={{
                          backgroundColor: v === 0
                            ? '#F3F4F6'
                            : `rgba(${HEAT_RGB}, ${0.2 + intensity * 0.8})`,
                        }}
                      />
                    )
                  })}
                </div>
              </div>
            ))}

            <div className="mt-3 flex items-center gap-2 text-xs text-muted">
              <span>Moins</span>
              {[0.2, 0.45, 0.7, 1].map((opacity) => (
                <div key={opacity} className="size-3 rounded" style={{ backgroundColor: `rgba(${HEAT_RGB}, ${opacity})` }} />
              ))}
              <span>Plus</span>
              <span className="ml-auto">Pic : {max} course{max > 1 ? 's' : ''}</span>
            </div>
          </div>
        )
      })()}
    </SectionShell>
  )
}
