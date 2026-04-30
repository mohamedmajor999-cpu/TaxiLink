'use client'

interface Props {
  data:    number[]
  color?:  string
  width?:  number
  height?: number
}

// Mini-courbe SVG inline. Aucune dépendance, scale automatique.
export function Sparkline({ data, color = '#10B981', width = 80, height = 24 }: Props) {
  if (data.length < 2) return <svg width={width} height={height} aria-hidden />

  const max = Math.max(...data, 0.0001)
  const min = Math.min(...data, 0)
  const range = max - min || 1
  const stepX = width / (data.length - 1)

  const pts = data.map((v, i) => {
    const x = i * stepX
    const y = height - ((v - min) / range) * height
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })

  const path = `M ${pts.join(' L ')}`
  const fillPath = `${path} L ${width},${height} L 0,${height} Z`

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden>
      <defs>
        <linearGradient id={`spark-${color.replace('#', '')}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillPath} fill={`url(#spark-${color.replace('#', '')})`} />
      <path d={path}     fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
