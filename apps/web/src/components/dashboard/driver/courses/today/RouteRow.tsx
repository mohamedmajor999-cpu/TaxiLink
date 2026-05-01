'use client'

interface Props {
  variant: 'pickup' | 'destination'
  address: string
  sublabel?: string | null
}

export function RouteRow({ variant, address, sublabel }: Props) {
  const isPickup = variant === 'pickup'
  return (
    <div className="flex items-start gap-2.5">
      <span
        className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
          isPickup ? 'bg-brand' : 'bg-paper'
        }`}
        aria-hidden="true"
      />
      <div className="min-w-0">
        <span
          className={`inline-block px-1.5 py-[1px] rounded text-[9px] font-extrabold uppercase tracking-[0.06em] mr-1.5 align-[1px] ${
            isPickup ? 'bg-brand/20 text-brand' : 'bg-paper/15 text-paper/85'
          }`}
        >
          {isPickup ? 'Patient' : 'Destination'}
        </span>
        <span className="text-[13.5px] text-paper/95 font-medium leading-tight">
          {address}
        </span>
        {sublabel && (
          <p className="text-[11px] text-paper/55 mt-0.5 leading-snug">{sublabel}</p>
        )}
      </div>
    </div>
  )
}
