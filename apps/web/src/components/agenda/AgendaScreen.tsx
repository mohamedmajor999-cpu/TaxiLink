'use client'

import { cn } from '@/lib/utils'
import { AgendaDayView } from './AgendaDayView'
import { AgendaWeekView } from './AgendaWeekView'
import { useAgendaScreen } from './useAgendaScreen'
import { SkeletonLoader } from '@/components/ui/SkeletonLoader'
import { ErrorBanner } from '@/components/ui/ErrorBanner'

export function AgendaScreen() {
  const {
    view, setView,
    selectedDate, setSelectedDate,
    setWeekOffset,
    today, weekDays,
    ridesForDay, ridesForSelected,
    dayStats, weekStats,
    prevDay, nextDay,
    loading, error,
  } = useAgendaScreen()

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

      {loading && <div className="px-5"><SkeletonLoader count={3} height="h-24" /></div>}
      {error && <div className="px-5"><ErrorBanner message={error} /></div>}

      {!loading && !error && view === 'jour' && (
        <AgendaDayView
          selectedDate={selectedDate}
          today={today}
          rides={ridesForSelected}
          stats={dayStats}
          onPrevDay={prevDay}
          onNextDay={nextDay}
        />
      )}

      {!loading && !error && view === 'semaine' && (
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
