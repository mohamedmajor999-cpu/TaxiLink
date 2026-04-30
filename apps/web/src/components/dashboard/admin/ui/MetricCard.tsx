'use client'

import type { ReactNode } from 'react'
import { TrendBadge } from './TrendBadge'
import { Sparkline } from './Sparkline'

interface Props {
  label:      string
  value:      string
  icon?:      ReactNode
  iconBg?:    string                          // ex: 'bg-emerald-100 text-emerald-700'
  sparkData?: number[]
  sparkColor?: string
  current?:   number                           // pour TrendBadge
  previous?:  number
  trendInverted?: boolean
  accent?:    string                           // sous-texte (ex: "+5 (30j)")
}

// Card métrique moderne : icône colorée + label + valeur géante + sparkline + tendance.
export function MetricCard({
  label, value, icon, iconBg = 'bg-bgsoft text-secondary',
  sparkData, sparkColor, current, previous, trendInverted, accent,
}: Props) {
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white p-4 shadow-soft ring-1 ring-line transition hover:shadow-card">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {icon && (
              <span className={`flex size-8 items-center justify-center rounded-xl ${iconBg}`}>
                {icon}
              </span>
            )}
            <div className="text-xs font-medium uppercase tracking-wide text-muted">{label}</div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-secondary">{value}</div>
          {accent && <div className="mt-0.5 text-xs text-muted">{accent}</div>}
        </div>

        {sparkData && sparkData.length > 1 && (
          <div className="shrink-0">
            <Sparkline data={sparkData} color={sparkColor} width={70} height={28} />
          </div>
        )}
      </div>

      {(current != null && previous != null) && (
        <div className="mt-3">
          <TrendBadge current={current} previous={previous} inverted={trendInverted} />
          <span className="ml-2 text-xs text-muted">vs période précédente</span>
        </div>
      )}
    </div>
  )
}
