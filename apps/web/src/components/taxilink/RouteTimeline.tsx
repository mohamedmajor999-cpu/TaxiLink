interface Point {
  name: string
  address?: string
}

interface Props {
  from: Point
  to: Point
  className?: string
  compact?: boolean
}

export function RouteTimeline({ from, to, className = '', compact = false }: Props) {
  const nameSize = compact ? 'text-[13px]' : 'text-[15px]'
  const addrSize = compact ? 'text-[11px]' : 'text-[12px]'
  return (
    <div className={`relative pl-1 py-1 ${className}`}>
      <div className="flex items-start gap-3 relative">
        <div className="w-2.5 h-2.5 rounded-full bg-ink mt-1 flex-shrink-0 relative z-10" />
        <div className="flex-1 min-w-0">
          <div className={`font-semibold ${nameSize} text-ink truncate leading-tight`}>{from.name}</div>
          {from.address && (
            <div className={`${addrSize} text-warm-500 truncate mt-0.5`}>{from.address}</div>
          )}
        </div>
      </div>

      <div
        className="absolute left-[9px] top-[18px] bottom-[18px] w-[1.5px]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to bottom, #D3D1C7 0, #D3D1C7 3px, transparent 3px, transparent 6px)',
        }}
        aria-hidden="true"
      />

      <div className="flex items-start gap-3 relative mt-3.5">
        <div className="w-2.5 h-2.5 rounded-full bg-brand border-2 border-ink mt-1 flex-shrink-0 relative z-10" />
        <div className="flex-1 min-w-0">
          <div className={`font-semibold ${nameSize} text-ink truncate leading-tight`}>{to.name}</div>
          {to.address && (
            <div className={`${addrSize} text-warm-500 truncate mt-0.5`}>{to.address}</div>
          )}
        </div>
      </div>
    </div>
  )
}
