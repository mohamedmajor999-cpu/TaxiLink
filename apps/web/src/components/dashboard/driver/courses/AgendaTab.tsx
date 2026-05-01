'use client'
import { useAgendaTab } from './useAgendaTab'
import { AgendaAddModal } from './AgendaAddModal'
import { WeekStrip } from './WeekStrip'
import { AgendaDayBlock } from './AgendaDayBlock'

export function AgendaTab() {
  const a = useAgendaTab()

  // Cliquer sur un jour de la WeekStrip → on scrolle vers le bloc du jour
  // si visible (scroll-margin-top compensé pour la sticky header).
  const onSelectDay = (d: Date) => {
    a.setSelected(d)
    if (typeof window === 'undefined') return
    const el = document.getElementById(`day-${d.toDateString()}`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="mt-2 pb-24 md:pb-6">
      <p className="text-[12px] text-warm-500 -mt-3 mb-1 capitalize">{a.weekRangeLabel}</p>

      <WeekStrip days={a.weekDays} selected={a.selected} onSelect={onSelectDay} />

      <div className="mt-4">
        {a.loading && (
          <div className="flex items-center justify-center py-12 text-warm-400 text-[14px]">
            Chargement…
          </div>
        )}

        {!a.loading && a.daysGroups.map((g) => (
          <AgendaDayBlock
            key={g.key}
            group={g}
            onTap={a.openDetails}
            onAdd={a.openAddModalFor}
          />
        ))}
      </div>

      {a.showAddModal && (
        <AgendaAddModal
          key={(a.addModalDate ?? a.selected).toDateString()}
          selectedDate={a.addModalDate ?? a.selected}
          onClose={a.closeAddModal}
          onAdded={a.addMission}
        />
      )}
    </div>
  )
}
