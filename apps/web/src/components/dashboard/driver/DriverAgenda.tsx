'use client'

import { AgendaWeekStrip } from './AgendaWeekStrip'
import { AgendaDayStats } from './AgendaDayStats'
import { AgendaMissionList } from './AgendaMissionList'
import { useDriverAgenda } from './useDriverAgenda'

export function DriverAgenda() {
  const { week, selected, today, title, current, stats, loading, hasMissions, setSelected, onPrev, onNext } = useDriverAgenda()

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <AgendaWeekStrip
        week={week} selected={selected} today={today} title={title}
        hasMissions={hasMissions} onSelect={setSelected} onPrev={onPrev} onNext={onNext}
      />
      <AgendaDayStats rides={stats.rides} km={stats.km} earnings={stats.earnings} />
      <AgendaMissionList missions={current} loading={loading} />
    </div>
  )
}
