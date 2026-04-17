'use client'

interface Props {
  city: string
  postalCode: string
  isOnline: boolean
  onToggleOnline: () => void
  initials: string
}

export function HomeMobileHeader({
  city, postalCode, isOnline, onToggleOnline, initials,
}: Props) {
  return (
    <header className="md:hidden flex items-center justify-between gap-3 mb-5">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-9 h-9 bg-ink rounded-lg flex items-center justify-center shrink-0">
          <div className="w-3 h-3 bg-brand rounded-sm" />
        </div>
        <div className="min-w-0">
          <div className="text-[15px] font-semibold text-ink leading-tight">TaxiLink</div>
          <div className="text-[12px] text-warm-500 truncate">
            {city} · {postalCode}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onToggleOnline}
          aria-pressed={isOnline}
          className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-[12px] font-medium transition-colors ${
            isOnline ? 'bg-ink text-paper' : 'bg-warm-100 text-warm-600'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-brand' : 'bg-warm-400'}`}
          />
          {isOnline ? 'En ligne' : 'Hors ligne'}
        </button>
        <div className="w-9 h-9 rounded-full border border-warm-300 bg-paper flex items-center justify-center text-[12px] font-semibold text-ink">
          {initials}
        </div>
      </div>
    </header>
  )
}
