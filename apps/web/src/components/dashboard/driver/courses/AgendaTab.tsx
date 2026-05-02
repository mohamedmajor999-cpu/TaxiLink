'use client'
import { useAgendaTab } from './useAgendaTab'
import { AgendaAddModal } from './AgendaAddModal'
import { WeekStrip } from './WeekStrip'
import { AgendaDayBlock } from './AgendaDayBlock'
import { agendaDayLabel, startOfDay, addDays } from './agendaHelpers'

export function AgendaTab() {
  const a = useAgendaTab()

  // Filtre 1 jour : la WeekStrip pilote daysGroups → seul le jour selectionne
  // est rendu. Si la date selectionnee n'est pas couverte par daysGroups (jour
  // passe ou au-dela de J+13), on construit un groupe vide a la volee.
  const selectedKey = a.selected.toDateString()
  const today = startOfDay(new Date())
  const tomorrow = addDays(today, 1)
  const visibleGroup = a.daysGroups.find((g) => g.key === selectedKey)
    ?? {
      key: selectedKey,
      date: a.selected,
      label: agendaDayLabel(a.selected, today, tomorrow),
      events: [],
      count: 0,
      total: 0,
    }

  return (
    <div className="mt-2 pb-24 md:pb-6 lg:max-w-5xl lg:mx-auto">
      <p className="text-[12px] text-warm-500 -mt-3 mb-1 capitalize">{a.weekRangeLabel}</p>

      <WeekStrip days={a.weekDays} selected={a.selected} onSelect={a.setSelected} />

      <div className="mt-4">
        {a.loading && (
          <div className="flex items-center justify-center py-12 text-warm-400 text-[14px]">
            Chargement…
          </div>
        )}

        {!a.loading && (
          <AgendaDayBlock
            key={visibleGroup.key}
            group={visibleGroup}
            onTap={a.openDetails}
            onAdd={a.openAddModalFor}
          />
        )}
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
