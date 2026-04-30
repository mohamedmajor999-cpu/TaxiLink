import { Icon } from '@/components/ui/Icon'

interface Props {
  current:   number
  previous:  number
  format?:   'percent' | 'absolute'
  inverted?: boolean
}

export function TrendBadge({ current, previous, format = 'percent', inverted = false }: Props) {
  if (previous === 0 && current === 0) {
    return <span className="text-xs text-muted">—</span>
  }
  if (previous === 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100">
        <Icon name="trending_up" size={14} />
        nouveau
      </span>
    )
  }

  const delta    = current - previous
  const pct      = (delta / previous) * 100
  const isUp     = delta > 0
  const isFlat   = Math.abs(pct) < 0.5
  const isGood   = inverted ? !isUp : isUp
  const valueStr = format === 'percent'
    ? `${Math.abs(pct).toFixed(1)}%`
    : `${Math.abs(delta).toLocaleString('fr-FR')}`

  const iconName = isFlat ? 'trending_flat' : isUp ? 'trending_up' : 'trending_down'
  const tone = isFlat
    ? 'bg-bgsoft text-muted ring-line'
    : isGood
      ? 'bg-emerald-50 text-emerald-700 ring-emerald-100'
      : 'bg-rose-50 text-rose-700 ring-rose-100'

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${tone}`}>
      <Icon name={iconName} size={14} />
      {valueStr}
    </span>
  )
}
