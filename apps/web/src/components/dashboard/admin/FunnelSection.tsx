'use client'

import { useMissionsSection } from './useMissionsSection'
import { SectionShell } from './ui/SectionShell'
import { Skeleton } from './ui/Skeleton'
import { Icon } from '@/components/ui/Icon'

interface Step {
  label:   string
  value:   number
  opacity: number
}

export function FunnelSection() {
  const { report, loading, error } = useMissionsSection()

  return (
    <SectionShell
      title="Funnel de conversion"
      subtitle="30 derniers jours — du dépôt à la course terminée"
      iconName="filter_list"
    >
      {loading && (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-2xl animate-pulse bg-bgsoft" />
          ))}
        </div>
      )}
      {error && <div className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}

      {report && (() => {
        const f = report.funnel
        const steps: Step[] = [
          { label: 'Postées',   value: f.posted,    opacity: 1 },
          { label: 'Vues',      value: f.viewed,    opacity: 0.85 },
          { label: 'Acceptées', value: f.accepted,  opacity: 0.7 },
          { label: 'Terminées', value: f.completed, opacity: 0.55 },
        ]
        const max = Math.max(steps[0].value, 1)

        return (
          <div className="space-y-3">
            {steps.map((s, i) => {
              const pct = (s.value / max) * 100
              const prev = i > 0 ? steps[i - 1].value : null
              const dropPct = prev != null && prev > 0 ? Math.round(((prev - s.value) / prev) * 100) : null

              return (
                <div key={s.label} className="flex items-center gap-3">
                  <div className="w-24 text-sm font-medium text-secondary">{s.label}</div>
                  <div className="relative h-10 flex-1 overflow-hidden rounded-2xl bg-bgsoft">
                    <div
                      className="absolute inset-y-0 left-0 flex items-center justify-end pr-3 bg-secondary transition-all duration-700"
                      style={{
                        width: `${pct}%`,
                        minWidth: s.value > 0 ? '60px' : '0',
                        opacity: s.opacity,
                      }}
                    >
                      <span className="text-sm font-semibold text-white">
                        {s.value.toLocaleString('fr-FR')}
                      </span>
                    </div>
                  </div>
                  <div className="w-20 text-right text-xs">
                    {dropPct != null && dropPct > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 font-medium text-rose-700 ring-1 ring-rose-100">
                        <Icon name="trending_down" size={12} />
                        {dropPct}%
                      </span>
                    ) : i === 0 ? (
                      <span className="text-muted">100%</span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </div>
                </div>
              )
            })}
            <p className="mt-4 flex items-start gap-2 text-xs text-muted">
              <Icon name="info" size={14} className="mt-0.5 shrink-0" />
              Les % rouges montrent la chute à chaque étape. Plus c&apos;est faible, mieux c&apos;est.
            </p>
          </div>
        )
      })()}
    </SectionShell>
  )
}
