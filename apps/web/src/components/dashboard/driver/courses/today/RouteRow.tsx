'use client'

interface Props {
  label: string
  address: string
  variant: 'origin' | 'destination'
}

export function RouteRow({ label, address, variant }: Props) {
  const isOrigin = variant === 'origin'
  return (
    <div className="grid grid-cols-[16px_1fr] gap-2.5 items-start">
      <span
        aria-hidden
        className={`justify-self-center mt-1.5 rounded-full ${
          isOrigin
            ? 'w-2.5 h-2.5 bg-paper'
            : 'w-3 h-3 bg-brand ring-2 ring-ink'
        }`}
      />
      <div className="min-w-0">
        <div className="text-[9px] font-extrabold uppercase tracking-[0.05em] text-paper/50">
          {label}
        </div>
        <div className="text-[13px] font-semibold text-paper leading-tight mt-0.5">
          {address}
        </div>
      </div>
    </div>
  )
}
