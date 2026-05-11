interface SparklineProps {
  values: number[]
  height?: number
  className?: string
  fillOpacity?: number
}

// Mini-graphique SVG en ligne (et zone remplie sous la courbe).
// Utilise currentColor pour s'adapter au theme parent.
export function Sparkline({ values, height = 40, className = '', fillOpacity = 0.15 }: SparklineProps) {
  if (values.length < 2) {
    // height en style inline : `h-${height}` etait une classe Tailwind
    // dynamique non purgee (h-100 n'existe pas dans la palette par defaut)
    // -> le placeholder etait invisible pour height>96.
    return <div className={className} style={{ height }} />
  }

  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const range = Math.max(max - min, 1)

  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * 100
    const y = 100 - ((v - min) / range) * 90 - 5  // 5% padding top/bottom
    return `${x},${y}`
  })

  const linePath = `M ${points.join(' L ')}`
  const areaPath = `${linePath} L 100,100 L 0,100 Z`

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className={className}
      style={{ height, width: '100%', display: 'block' }}
      aria-hidden="true"
    >
      <path d={areaPath} fill="currentColor" fillOpacity={fillOpacity} />
      <path d={linePath} fill="none" stroke="currentColor" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
      <circle cx={points[points.length - 1].split(',')[0]} cy={points[points.length - 1].split(',')[1]} r={1.5} fill="currentColor" />
    </svg>
  )
}
