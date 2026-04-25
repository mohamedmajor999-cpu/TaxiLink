'use client'
import { Plus } from 'lucide-react'
import { useAgendaTab } from './useAgendaTab'
import { AgendaAddModal } from './AgendaAddModal'
import { WeekStrip } from './WeekStrip'
import { AgendaStats } from './AgendaStats'
import { AgendaEventCard } from './AgendaEventCard'

export function AgendaTab() {
  const a = useAgendaTab()

  return (
    <div className="mt-2 pb-24 md:pb-6 relative">
      <p className="text-[12px] text-warm-500 -mt-3 mb-1 capitalize">{a.weekRangeLabel}</p>

      <WeekStrip days={a.weekDays} selected={a.selected} onSelect={a.setSelected} />

      <AgendaStats count={a.stats.count} total={a.stats.total} km={a.stats.km} />

      <h3 className="mt-5 mb-2 text-[11px] font-extrabold uppercase tracking-[0.08em] text-warm-500">
        {a.planningTitle} — Planning
      </h3>

      <div className="space-y-2">
        {a.loading && (
          <div className="flex items-center justify-center py-12 text-warm-400 text-[14px]">
            Chargement…
          </div>
        )}

        {!a.loading && a.events.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-[16px] font-bold text-ink">Aucune course ce jour-là</p>
            <p className="text-[13px] text-warm-400 mt-1.5">
              Appuyez sur le bouton + pour en ajouter une
            </p>
          </div>
        )}

        {a.events.map((e) => (
          <AgendaEventCard key={e.id} event={e} onTap={() => a.openDetails(e.id)} />
        ))}
      </div>

      <button
        type="button"
        onClick={() => a.setShowAddModal(true)}
        aria-label="Ajouter une course"
        className="md:hidden fixed bottom-20 right-4 w-14 h-14 rounded-full bg-brand text-ink shadow-fab hover:shadow-fab-hover flex items-center justify-center active:scale-95 transition-all z-30"
      >
        <Plus className="w-6 h-6" strokeWidth={2.6} />
      </button>
      <button
        type="button"
        onClick={() => a.setShowAddModal(true)}
        className="hidden md:inline-flex mt-5 items-center gap-2 h-12 px-5 rounded-xl bg-ink text-paper text-[14px] font-bold hover:bg-warm-800 transition-colors"
      >
        <Plus className="w-4 h-4" strokeWidth={2.4} />
        Ajouter une course
      </button>

      {a.showAddModal && (
        <AgendaAddModal
          key={a.selected.toDateString()}
          selectedDate={a.selected}
          onClose={() => a.setShowAddModal(false)}
          onAdded={a.addMission}
        />
      )}
    </div>
  )
}
