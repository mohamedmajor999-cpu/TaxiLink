'use client'
import type { ReactNode } from 'react'
import { MapPin } from 'lucide-react'

interface Props {
  isOnline: boolean
  count: number
  initials: string
  onToggleOnline: () => void
  onProfile: () => void
  onRequestLocation?: () => void
  middle?: ReactNode
}

export function DriverHomeTopOverlay({
  isOnline, count, initials,
  onToggleOnline, onProfile, onRequestLocation, middle,
}: Props) {
  return (
    <div className="absolute top-3 left-0 right-0 px-4 z-[500] flex items-center justify-between gap-2 pointer-events-none">
      <button
        type="button"
        onClick={onToggleOnline}
        className="pointer-events-auto inline-flex items-center gap-2 h-10 px-3.5 rounded-full bg-paper border border-warm-200 shadow-[0_4px_14px_rgba(0,0,0,0.08)] text-[12.5px] font-bold text-ink"
        aria-pressed={isOnline}
      >
        <span
          aria-hidden="true"
          className={`w-2 h-2 rounded-full ${isOnline ? 'bg-[#10B981]' : 'bg-warm-300'}`}
          style={isOnline ? { boxShadow: '0 0 0 4px rgba(16,185,129,0.18)' } : undefined}
        />
        {isOnline ? 'En ligne' : 'Hors ligne'}
        <span className="text-warm-500 font-semibold">·</span>
        <span className="text-warm-500 font-semibold">{count} annonce{count > 1 ? 's' : ''}</span>
      </button>

      {middle && (
        <div className="pointer-events-auto flex-1 min-w-0 hidden landscape:flex items-center">
          {middle}
        </div>
      )}

      <div className="pointer-events-auto flex items-center gap-2">
        {onRequestLocation && (
          <button
            type="button"
            onClick={onRequestLocation}
            className="inline-flex items-center gap-1 h-10 px-3 rounded-full bg-paper border border-warm-200 shadow-[0_4px_14px_rgba(0,0,0,0.08)] text-[12px] font-semibold text-ink"
            aria-label="Activer la géolocalisation"
          >
            <MapPin className="w-3.5 h-3.5" strokeWidth={2} />
            Ma position
          </button>
        )}
        <button
          type="button"
          onClick={onProfile}
          aria-label="Mon profil"
          className="w-10 h-10 rounded-full bg-ink text-paper flex items-center justify-center text-[13px] font-extrabold shadow-[0_4px_14px_rgba(0,0,0,0.2)]"
        >
          {initials}
        </button>
      </div>
    </div>
  )
}
