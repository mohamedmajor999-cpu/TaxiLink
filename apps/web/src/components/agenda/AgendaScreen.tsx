'use client'

import { useState, useMemo } from 'react'
import { mockAgendaRides } from '@taxilink/core'
import type { AgendaRide } from '@taxilink/core'
import { cn } from '@/lib/utils'
import { isSameDay } from '@/lib/utils'
import { AgendaDayView } from './AgendaDayView'
import { AgendaWeekView } from './AgendaWeekView'

type View = 'jour' | 'semaine'

function computeStats(rides: AgendaRide[]) {
  return {
    rides: rides.length,
    km: rides.reduce((s, r) => s + r.distanceKm, 0),
    earnings: rides.reduce((s, r) => s + r.priceEur, 0),
  }
}

export function AgendaScreen() {
  const [view, setView] = useState<View>('jour')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [weekOffset, setWeekOffset] = useState(0)

  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const weekDays = useMemo(() => {
    const base = new Date(today)
    base.setDate(base.getDate() + weekOffset * 7)
    const monday = new Date(base)
    monday.setDate(base.getDate() - ((base.getDay() + 6) % 7))
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      return d
    })
  }, [today, weekOffset])

  const ridesForDay = (date: Date): AgendaRide[] =>
    mockAgendaRides.filter((r) => isSameDay(new Date(r.scheduledAt), date))

  const ridesForSelected = ridesForDay(selectedDate)
  const ridesForWeek = weekDays.flatMap((d) => ridesForDay(d))

  const dayStats = useMemo(() => computeStats(ridesForSelected), [ridesForSelected])
  const weekStats = useMemo(() => computeStats(ridesForWeek), [ridesForWeek])

  const prevDay = () => setSelectedDate((d) => { const n = new Date(d); n.setDate(n.getDate() - 1); return n })
  const nextDay = () => setSelectedDate((d) => { const n = new Date(d); n.setDate(n.getDate() + 1); return n })

  return (
    <div className="pt-5 pb-28 hide-scrollbar">
      {/* Header */}
      <div className="px-5 flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold tracking-tight text-secondary">Agenda</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('jour')}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-bold transition-all', view === 'jour' ? 'bg-secondary text-white' : 'bg-bgsoft text-muted')}
          >
            Jour
          </button>
          <button
            onClick={() => setView('semaine')}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-bold transition-all', view === 'semaine' ? 'bg-secondary text-white' : 'bg-bgsoft text-muted')}
          >
            Semaine
          </button>
        </div>
      </div>

      {view === 'jour' && (
        <AgendaDayView
          selectedDate={selectedDate}
          today={today}
          rides={ridesForSelected}
          stats={dayStats}
          onPrevDay={prevDay}
          onNextDay={nextDay}
        />
      )}

      {view === 'semaine' && (
        <AgendaWeekView
          weekDays={weekDays}
          selectedDate={selectedDate}
          today={today}
          weekStats={weekStats}
          ridesForDay={ridesForDay}
          onPrevWeek={() => setWeekOffset((w) => w - 1)}
          onNextWeek={() => setWeekOffset((w) => w + 1)}
          onSelectDay={(day) => { setSelectedDate(day); setView('jour') }}
        />
      )}
    </div>
  )
}
