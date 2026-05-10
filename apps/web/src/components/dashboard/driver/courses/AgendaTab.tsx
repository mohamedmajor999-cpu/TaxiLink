'use client'
import { X } from 'lucide-react'
import { useAgendaTab } from './useAgendaTab'
import { AgendaAddModal } from './AgendaAddModal'
import { AgendaCardMenu } from './AgendaCardMenu'
import { WeekStrip } from './WeekStrip'
import { AgendaDayBlock } from './AgendaDayBlock'
import { agendaDayLabel, startOfDay, addDays } from './agendaHelpers'
import { CancelMissionDialog } from '../course/CancelMissionDialog'
import { ConfirmDeleteCourseDialog } from './ConfirmDeleteCourseDialog'

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

      {a.error && (
        <div className="mt-3 px-3 py-2.5 rounded-xl bg-danger-soft text-danger text-[13px] flex items-start justify-between gap-3">
          <span className="leading-snug">{a.error}</span>
          <button
            type="button"
            onClick={a.dismissError}
            aria-label="Fermer"
            className="shrink-0 p-1 rounded-lg hover:bg-danger/10 transition-colors"
          >
            <X className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>
      )}

      <WeekStrip
        days={a.weekDays}
        selected={a.selected}
        onSelect={a.setSelected}
        onPrev={a.goPrevWeek}
        onNext={a.goNextWeek}
        canPrev={a.canPrevWeek}
        canNext={a.canNextWeek}
      />

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
            onMenu={a.openMenuFor}
          />
        )}
      </div>

      {a.showAddModal && (
        <AgendaAddModal
          key={(a.addModalDate ?? a.selected).toDateString()}
          selectedDate={a.addModalDate ?? a.selected}
          onClose={a.closeAddModal}
          onAdded={a.addMission}
          minDate={a.today}
          maxDate={a.maxDate}
        />
      )}

      {a.menuMission && (
        <AgendaCardMenu
          isManual={a.isManualMenu}
          onClose={a.closeMenu}
          onDetail={() => {
            const id = a.menuMission!.id
            a.closeMenu()
            a.openDetails(id)
          }}
          onEdit={() => a.openEditFor(a.menuMission!.id)}
          onDelete={() => a.requestDelete(a.menuMission!.id)}
        />
      )}

      {a.editMission && (
        <AgendaAddModal
          key={`edit-${a.editMission.id}`}
          selectedDate={new Date(a.editMission.scheduled_at)}
          mission={a.editMission}
          minDate={a.today}
          maxDate={a.maxDate}
          onClose={a.closeEdit}
          onAdded={a.updateMission}
        />
      )}

      <ConfirmDeleteCourseDialog
        open={a.deletingMission !== null}
        busy={a.busyId === a.deletingMission?.id}
        onCancel={a.closeDeleteConfirm}
        onConfirm={() => a.deletingMission && a.deleteMission(a.deletingMission.id)}
      />

      <CancelMissionDialog
        open={a.cancelOpenId !== null}
        submitting={a.busyId === a.cancelOpenId}
        onClose={a.closeCancel}
        onSubmit={(reason) => a.cancelOpenId && a.cancelMission(a.cancelOpenId, reason)}
      />
    </div>
  )
}
