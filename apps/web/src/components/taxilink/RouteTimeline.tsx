interface Point {
  name: string
  address?: string
}

interface Props {
  from: Point
  to: Point
  className?: string
}

export function RouteTimeline({ from, to, className = '' }: Props) {
  return (
    <div className={`relative pl-1 py-1 ${className}`}>
      <div className="flex items-start gap-3 relative">
        <div className="w-2.5 h-2.5 rounded-full bg-ink mt-1 flex-shrink-0 relative z-10" />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm text-ink truncate">{from.name}</div>
          {from.address && (
            <div className="text-xs text-warm-500 truncate">{from.address}</div>
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
          <div className="font-semibold text-sm text-ink truncate">{to.name}</div>
          {to.address && (
            <div className="text-xs text-warm-500 truncate">{to.address}</div>
          )}
        </div>
      </div>
    </div>
  )
}
