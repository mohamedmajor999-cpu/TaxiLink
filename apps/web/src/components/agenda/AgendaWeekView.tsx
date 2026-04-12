'use client'

import { Icon } from '@/components/ui/Icon'
import { isSameDay, cn } from '@/lib/utils'
import { RideCard } from './RideCard'
import type { AgendaRide } from '@taxilink/core'

const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

interface Stats {
  rides: number
  km: number
  earnings: number
}

interface Props {
  weekDays: Date[]
  selectedDate: Date
  today: Date
  weekStats: Stats
  ridesForDay: (date: Date) => AgendaRide[]
  onPrevWeek: () => void
  onNextWeek: () => void
  onSelectDay: (day: Date) => void
}

function formatWeekRange(weekDays: Date[]): string {
  const first = weekDays[0]
  const last = weekDays[6]
  return `${first.getDate()} ${first.toLocaleDateString('fr-FR', { month: 'short' })} – ${last.getDate()} ${last.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}`
}

export function AgendaWeekView({ weekDays, selectedDate, today, weekStats, ridesForDay, onPrevWeek, onNextWeek, onSelectDay }: Props) {
  return (
    <div>
      {/* Week navigation */}
      <div className="px-5 flex items-center justify-between mb-4">
        <button onClick={onPrevWeek} aria-label="Semaine précédente" className="w-9 h-9 rounded-xl bg-bgsoft flex items-center justify-center">
          <Icon name="chevron_left" size={20} />
        </button>
        <div className="text-sm font-bold text-secondary">{formatWeekRange(weekDays)}</div>
        <button onClick={onNextWeek} aria-label="Semaine suivante" className="w-9 h-9 rounded-xl bg-bgsoft flex items-center justify-center">
          <Icon name="chevron_right" size={20} />
        </button>
      </div>

      {/* Mini calendar */}
      <div className="px-5 mb-4">
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((day, i) => {
            const dayRides = ridesForDay(day)
            const isSelected = isSameDay(day, selectedDate)
            const isToday = isSameDay(day, today)
            return (
              <button
                key={i}
                onClick={() => onSelectDay(day)}
                aria-label={`Voir le ${day.toLocaleDateString('fr-FR')}`}
                className={cn(
                  'semaine-day-cell flex flex-col items-center py-2 rounded-xl',
                  isSelected && 'selected',
                  !isSelected && isToday && 'today'
                )}
              >
                <span className="text-[10px] font-semibold uppercase tracking-wide">{DAY_LABELS[day.getDay()]}</span>
                <span className="text-sm font-bold mt-0.5">{day.getDate()}</span>
                {dayRides.length > 0 && <div className="w-1 h-1 rounded-full mt-1 bg-primary" />}
              </button>
            )
          })}
        </div>
      </div>

      {/* Week stats */}
      <div className="px-5 mb-4">
        <div className="bg-white rounded-2xl shadow-soft p-4 grid grid-cols-3 divide-x divide-line">
          <div className="flex flex-col items-center gap-1">
            <div className="text-2xl font-black text-secondary">{weekStats.rides}</div>
            <div className="text-[10px] text-muted uppercase tracking-wider font-semibold">Courses</div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="text-2xl font-black text-secondary">{weekStats.km.toFixed(0)}</div>
            <div className="text-[10px] text-muted uppercase tracking-wider font-semibold">km</div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="text-2xl font-black text-secondary">{weekStats.earnings.toFixed(0)}€</div>
            <div className="text-[10px] text-muted uppercase tracking-wider font-semibold">Gains</div>
          </div>
        </div>
      </div>

      {/* Week rides grouped by day */}
      <div className="px-5 space-y-4">
        {weekDays.map((day) => {
          const dayRides = ridesForDay(day)
          if (dayRides.length === 0) return null
          return (
            <div key={day.toISOString()}>
              <div className="flex items-center gap-2 mb-2">
                <div className="text-xs font-bold text-secondary capitalize">
                  {day.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' })}
                </div>
                <div className="h-px flex-1 bg-line" />
                <div className="text-xs font-semibold text-muted">{dayRides.length} course{dayRides.length > 1 ? 's' : ''}</div>
              </div>
              <div className="space-y-2">
                {dayRides.map((ride) => <RideCard key={ride.id} ride={ride} compact />)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
