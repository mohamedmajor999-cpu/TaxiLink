interface Props {
  current:   number
  previous:  number
  format?:   'percent' | 'absolute'
  inverted?: boolean   // true si la baisse est positive (ex: temps de réponse)
}

// Badge ↑↓ avec % de variation, coloration verte/rouge selon le sens.
export function TrendBadge({ current, previous, format = 'percent', inverted = false }: Props) {
  if (previous === 0 && current === 0) {
    return <span className="text-xs text-muted">—</span>
  }
  if (previous === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
        <span aria-hidden>↑</span> nouveau
      </span>
    )
  }

  const delta    = current - previous
  const pct      = (delta / previous) * 100
  const isUp     = delta > 0
  const isFlat   = Math.abs(pct) < 0.5
  const isGood   = inverted ? !isUp : isUp
  const arrow    = isFlat ? '→' : isUp ? '↑' : '↓'
  const valueStr = format === 'percent'
    ? `${Math.abs(pct).toFixed(1)}%`
    : `${Math.abs(delta).toLocaleString('fr-FR')}`

  const tone = isFlat
    ? 'bg-bgsoft text-muted ring-line'
    : isGood
      ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
      : 'bg-rose-50 text-rose-700 ring-rose-200'

  return (
    <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${tone}`}>
      <span aria-hidden>{arrow}</span>
      {valueStr}
    </span>
  )
}
