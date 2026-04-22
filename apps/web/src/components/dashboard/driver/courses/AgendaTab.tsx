'use client'
import { Plus } from 'lucide-react'
import { useAgendaTab, type AgendaEvent } from './useAgendaTab'
import { AgendaAddModal } from './AgendaAddModal'

const BADGE: Record<string, { bg: string; text: string; label: string }> = {
  CPAM:     { bg: 'bg-blue-100',    text: 'text-blue-700',    label: 'Médical'  },
  PRIVE:    { bg: 'bg-amber-100',   text: 'text-amber-700',   label: 'Privé'    },
  TAXILINK: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'TaxiLink' },
}

const LEFT_BORDER: Record<string, string> = {
  CPAM:      'border-l-blue-400',
  PRIVE:     'border-l-amber-400',
  TAXILINK:  'border-l-emerald-400',
  manual:    'border-l-purple-400',
  completed: 'border-l-warm-200',
  now:       'border-l-primary',
}

export function AgendaTab() {
  const a = useAgendaTab()

  return (
    <div className="mt-4 pb-6">
      {/* Sélecteur de jours */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-none">
        {a.dayPills.map((p) => {
          const active = a.selected.toDateString() === p.key
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => a.setSelected(p.date)}
              className={`shrink-0 flex flex-col items-center min-w-[68px] py-2.5 px-3 rounded-2xl text-center transition-colors ${
                active ? 'bg-ink text-paper' : 'bg-warm-100 text-ink'
              }`}
            >
              <span className="text-[13px] font-bold capitalize leading-tight">{p.label}</span>
              <span className={`text-[11px] mt-0.5 ${active ? 'text-paper/60' : 'text-warm-400'}`}>{p.subLabel}</span>
            </button>
          )
        })}
      </div>

      {/* Stats du jour */}
      {a.stats.count > 0 && (
        <div className="flex items-center gap-1.5 mt-3 px-1">
          <span className="text-[13px] font-bold text-ink">
            {a.stats.count} course{a.stats.count > 1 ? 's' : ''}
          </span>
          {a.stats.total > 0 && (
            <>
              <span className="text-warm-300">·</span>
              <span className="text-[13px] font-bold text-ink">{a.stats.total}€</span>
            </>
          )}
          {a.stats.km > 0 && (
            <>
              <span className="text-warm-300">·</span>
              <span className="text-[13px] text-warm-500">{Math.round(a.stats.km)} km</span>
            </>
          )}
        </div>
      )}

      {/* Liste des courses */}
      <div className="mt-3 space-y-2">
        {a.loading && (
          <div className="flex items-center justify-center py-16 text-warm-400 text-[14px]">
            Chargement…
          </div>
        )}

        {!a.loading && a.events.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-[16px] font-bold text-ink">Aucune course ce jour-là</p>
            <p className="text-[13px] text-warm-400 mt-1.5">
              Appuyez sur le bouton ci-dessous pour en ajouter une
            </p>
          </div>
        )}

        {a.events.map((e) => (
          <CourseCard key={e.id} event={e} onTap={() => a.openDetails(e.id)} />
        ))}
      </div>

      {/* Bouton Ajouter */}
      <button
        type="button"
        onClick={() => a.setShowAddModal(true)}
        className="mt-4 w-full h-14 rounded-2xl bg-ink text-paper text-[15px] font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
      >
        <Plus className="w-5 h-5" strokeWidth={2.5} />
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

function CourseCard({ event: e, onTap }: { event: AgendaEvent; onTap: () => void }) {
  const isDone = e.status === 'completed'
  const isNow = e.status === 'now'
  const badge = e.isManual
    ? { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Manuel' }
    : BADGE[e.type] ?? BADGE.PRIVE
  const borderKey = e.isManual ? 'manual' : isNow ? 'now' : isDone ? 'completed' : e.type
  const leftBorder = LEFT_BORDER[borderKey] ?? 'border-l-warm-200'
  const fmt = (d: Date) => d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

  return (
    <button
      type="button"
      onClick={onTap}
      className={`w-full text-left bg-paper border border-warm-200 border-l-[3px] ${leftBorder} rounded-2xl px-4 py-4 transition-all active:scale-[0.98] ${
        isNow ? 'shadow-card' : ''
      } ${isDone ? 'opacity-50' : ''}`}
    >
      <div className="flex items-center gap-3">
        {/* Heure */}
        <div className="flex flex-col items-center min-w-[46px] shrink-0">
          <span className="text-[18px] font-bold tabular-nums leading-none text-ink">{fmt(e.start)}</span>
          <span className="text-[11px] text-warm-400 tabular-nums mt-1">{fmt(e.end)}</span>
        </div>

        <div className="w-px h-10 bg-warm-200 shrink-0" />

        {/* Trajet */}
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-semibold text-ink truncate leading-snug">{e.from.split(',')[0]}</p>
          <p className="text-[12px] text-warm-400 leading-none my-0.5">↓</p>
          <p className="text-[14px] font-semibold text-ink truncate leading-snug">{e.to.split(',')[0]}</p>
        </div>

        {/* Prix + badge */}
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span className="text-[18px] font-bold tabular-nums leading-none text-ink">
            {e.priceEur > 0 ? `${e.priceEur}€` : '—'}
          </span>
          <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${badge.bg} ${badge.text}`}>
            {badge.label}
          </span>
        </div>
      </div>

      {isNow && (
        <div className="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t border-warm-100">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shrink-0" />
          <span className="text-[11px] font-bold text-warm-500 uppercase tracking-wider">En cours</span>
        </div>
      )}
    </button>
  )
}
