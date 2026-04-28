'use client'
import type { ReactNode } from 'react'
import { MapPin, Moon, Sun, Clock } from 'lucide-react'
import type { NightModePref } from '@/store/nightModeStore'

interface Props {
  isOnline: boolean
  count: number
  initials: string
  onToggleOnline: () => void
  onProfile: () => void
  onRequestLocation?: () => void
  middle?: ReactNode
  nightPref?: NightModePref
  nightActive?: boolean
  onToggleNight?: () => void
}

export function DriverHomeTopOverlay({
  isOnline, count, initials,
  onToggleOnline, onProfile, onRequestLocation, middle,
  nightPref, nightActive, onToggleNight,
}: Props) {
  const NightIcon = nightPref === 'auto' ? Clock : nightActive ? Moon : Sun
  const nightLabel = nightPref === 'auto'
    ? `Mode auto (${nightActive ? 'nuit' : 'jour'})`
    : nightActive ? 'Mode nuit' : 'Mode jour'
  return (
    <div className="absolute top-3 left-0 right-0 pl-[64px] pr-4 md:px-4 z-[500] flex items-center justify-between gap-2 pointer-events-none">
      <button
        type="button"
        onClick={onToggleOnline}
        aria-pressed={isOnline}
        className={`pointer-events-auto inline-flex items-center gap-2 h-11 pl-3.5 pr-2 rounded-full text-[13px] font-bold tracking-tight transition-all shadow-[0_8px_24px_rgba(0,0,0,0.18)] active:scale-[0.97] ${
          isOnline
            ? 'bg-ink text-paper dark:bg-night-elevated dark:text-night-text'
            : 'bg-paper text-ink border border-warm-200 dark:bg-night-surface dark:text-night-text dark:border-night-border'
        }`}
      >
        <span
          aria-hidden="true"
          className={`w-2 h-2 rounded-full ${isOnline ? 'bg-[#34D399]' : 'bg-warm-400 dark:bg-night-text-soft'}`}
          style={isOnline ? { boxShadow: '0 0 0 4px rgba(52,211,153,0.28)' } : undefined}
        />
        {isOnline ? 'En ligne' : 'Hors ligne'}
        <span
          className={`ml-0.5 inline-flex items-center justify-center min-w-[26px] h-[24px] px-1.5 rounded-full text-[11.5px] font-extrabold tabular-nums ${
            isOnline
              ? 'bg-paper/15 text-paper'
              : 'bg-warm-100 text-ink dark:bg-night-elevated dark:text-night-text'
          }`}
          aria-label={`${count} annonce${count > 1 ? 's' : ''}`}
        >
          {count}
        </span>
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
            className="inline-flex items-center gap-1 h-10 px-3 rounded-full bg-paper dark:bg-night-surface border border-warm-200 dark:border-night-border shadow-[0_4px_14px_rgba(0,0,0,0.08)] text-[12px] font-semibold text-ink dark:text-night-text"
            aria-label="Activer la géolocalisation"
          >
            <MapPin className="w-3.5 h-3.5" strokeWidth={2} />
            Ma position
          </button>
        )}
        {onToggleNight && (
          <button
            type="button"
            onClick={onToggleNight}
            aria-label={nightLabel}
            title={nightLabel}
            className="w-10 h-10 rounded-full bg-paper dark:bg-night-surface border border-warm-200 dark:border-night-border flex items-center justify-center text-ink dark:text-night-text shadow-[0_4px_14px_rgba(0,0,0,0.08)]"
          >
            <NightIcon className="w-4 h-4" strokeWidth={2} />
          </button>
        )}
        <button
          type="button"
          onClick={onProfile}
          aria-label="Mon profil"
          className="w-10 h-10 rounded-full bg-ink dark:bg-night-brand text-paper dark:text-night-bg flex items-center justify-center text-[13px] font-extrabold shadow-[0_4px_14px_rgba(0,0,0,0.2)]"
        >
          {initials}
        </button>
      </div>
    </div>
  )
}
