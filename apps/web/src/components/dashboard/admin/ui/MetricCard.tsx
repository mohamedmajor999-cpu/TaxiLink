'use client'

import { Icon } from '@/components/ui/Icon'
import { TrendBadge } from './TrendBadge'
import { Sparkline } from './Sparkline'

interface Props {
  label:          string
  value:          string
  iconName?:      string
  sparkData?:     number[]
  sparkColor?:    string
  current?:       number
  previous?:      number
  trendInverted?: boolean
  accent?:        string
}

export function MetricCard({
  label, value, iconName,
  sparkData, sparkColor = '#1A1A1A', current, previous, trendInverted, accent,
}: Props) {
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white p-4 shadow-soft ring-1 ring-line/60 transition hover:shadow-card">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {iconName && (
              <span className="flex size-8 items-center justify-center rounded-xl bg-bgsoft text-secondary">
                <Icon name={iconName} size={18} />
              </span>
            )}
            <div className="text-xs font-medium uppercase tracking-wide text-muted">{label}</div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-secondary">{value}</div>
          {accent && <div className="mt-0.5 text-xs text-muted">{accent}</div>}
        </div>

        {sparkData && sparkData.length > 1 && (
          <div className="shrink-0 opacity-80">
            <Sparkline data={sparkData} color={sparkColor} width={70} height={28} />
          </div>
        )}
      </div>

      {(current != null && previous != null) && (
        <div className="mt-3 flex items-center gap-2">
          <TrendBadge current={current} previous={previous} inverted={trendInverted} />
          <span className="text-xs text-muted">vs période précédente</span>
        </div>
      )}
    </div>
  )
}
