'use client'

import { Icon } from '@/components/ui/Icon'
import { formatDayRelative, formatDateNumericLong } from '@/lib/utils'
import { RideCard } from './RideCard'
import type { AgendaRide } from '@taxilink/core'

interface Stats {
  rides: number
  km: number
  earnings: number
}

interface Props {
  selectedDate: Date
  today: Date
  rides: AgendaRide[]
  stats: Stats
  onPrevDay: () => void
  onNextDay: () => void
}

export function AgendaDayView({ selectedDate, today, rides, stats, onPrevDay, onNextDay }: Props) {
  return (
    <div>
      {/* Day navigation */}
      <div className="px-5 flex items-center justify-between mb-4">
        <button
          onClick={onPrevDay}
          aria-label="Jour précédent"
          className="w-9 h-9 rounded-xl bg-bgsoft flex items-center justify-center"
        >
          <Icon name="chevron_left" size={20} />
        </button>
        <div className="text-center">
          <div className="text-base font-bold tracking-tight text-secondary capitalize">
            {formatDayRelative(selectedDate, today)}
          </div>
          <div className="text-xs text-muted font-medium">{formatDateNumericLong(selectedDate)}</div>
        </div>
        <button
          onClick={onNextDay}
          aria-label="Jour suivant"
          className="w-9 h-9 rounded-xl bg-bgsoft flex items-center justify-center"
        >
          <Icon name="chevron_right" size={20} />
        </button>
      </div>

      {/* Day stats */}
      <div className="px-5 mb-4 grid grid-cols-3 gap-2">
        <div className="bg-white rounded-2xl shadow-soft p-3 flex flex-col gap-1.5">
          <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
            <Icon name="directions_car" size={15} className="text-secondary" />
          </div>
          <div className="text-2xl font-black text-secondary leading-none">{stats.rides}</div>
          <div className="text-[10px] text-muted uppercase tracking-wider font-semibold">Courses</div>
        </div>
        <div className="bg-white rounded-2xl shadow-soft p-3 flex flex-col gap-1.5">
          <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
            <Icon name="route" size={15} className="text-secondary" />
          </div>
          <div className="text-2xl font-black text-secondary leading-none">{stats.km.toFixed(0)}</div>
          <div className="text-[10px] text-muted uppercase tracking-wider font-semibold">km</div>
        </div>
        <div className="bg-secondary rounded-2xl shadow-soft p-3 flex flex-col gap-1.5">
          <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
            <Icon name="euro" size={15} className="text-primary" />
          </div>
          <div className="text-2xl font-black text-primary leading-none">{stats.earnings.toFixed(0)}€</div>
          <div className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">Gains</div>
        </div>
      </div>

      {/* Rides list */}
      <div className="px-5 space-y-3">
        {rides.length === 0 ? (
          <div className="pt-10 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-bgsoft flex items-center justify-center mb-3">
              <Icon name="event_busy" size={32} className="text-muted" />
            </div>
            <div className="font-semibold text-secondary mb-1">Aucune course prévue</div>
            <div className="text-xs text-muted">Pas de course planifiée ce jour-là.</div>
          </div>
        ) : (
          rides.map((ride) => <RideCard key={ride.id} ride={ride} />)
        )}
      </div>
    </div>
  )
}
