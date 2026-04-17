'use client'
import { OnlineDot } from '@/components/taxilink/OnlineDot'
import { useAgendaTab, type AgendaEvent, type AgendaEventStatus } from './useAgendaTab'

const VARIANT_CLASSES: Record<AgendaEventStatus, string> = {
  completed: 'bg-warm-50 opacity-60 border-l-2 border-warm-300 text-ink',
  now: 'bg-brand-soft border-l-4 border-ink font-medium shadow-card text-ink',
  scheduled: 'bg-paper border border-warm-300 text-ink',
  private: 'bg-warm-50 border-l-2 border-warm-400 text-ink',
}

export function AgendaTab() {
  const a = useAgendaTab()

  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 overflow-x-auto pb-1 mb-4 -mx-4 px-4 md:mx-0 md:px-0">
        {a.dayPills.map((p) => {
          const active = a.selected.toDateString() === p.key
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => a.setSelected(p.date)}
              className={`shrink-0 inline-flex flex-col items-start gap-0 h-auto px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${active ? 'bg-ink text-paper' : 'bg-warm-100 text-ink hover:bg-warm-200'}`}
            >
              <span className="capitalize">{p.label}</span>
              <span className={`text-[10px] font-medium ${active ? 'text-paper/70' : 'text-warm-500'}`}>
                {p.subLabel}
              </span>
            </button>
          )
        })}
      </div>

      <div className="rounded-2xl border border-warm-200 bg-paper overflow-hidden">
        <header className="flex items-center justify-between px-5 py-3 border-b border-warm-200 sticky top-0 bg-paper z-10">
          <div className="text-sm">
            <span className="font-semibold text-ink capitalize">{a.title}</span>
            <span className="text-warm-500"> · {a.stats.count} course{a.stats.count > 1 ? 's' : ''} · {a.stats.total}€ · {a.stats.km.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} km</span>
          </div>
          {a.nowTopPx !== null && (
            <div className="flex items-center gap-1.5 text-[11px] text-warm-600">
              <OnlineDot size="sm" />
              Maintenant
            </div>
          )}
        </header>

        <div ref={a.gridRef} className="h-[560px] overflow-y-auto">
          <div className="relative" style={{ height: `${a.dayHeight}px` }}>
            {a.hours.map((h, i) => (
              <div key={h} className="absolute left-0 right-0 border-t border-warm-100" style={{ top: `${i * 60}px` }}>
                <span className="absolute -top-2 left-2 text-[11px] text-warm-500 bg-paper px-1">
                  {String(h).padStart(2, '0')}:00
                </span>
              </div>
            ))}

            {a.events.length === 0 && !a.loading && (
              <div className="absolute left-[70px] right-3 top-8 text-sm text-warm-500">
                Aucune course ce jour-là.
              </div>
            )}

            {a.events.map((e) => <EventCard key={e.id} event={e} />)}

            {a.nowTopPx !== null && (
              <div
                className="absolute left-0 right-0 pointer-events-none z-20"
                style={{ top: `${a.nowTopPx}px` }}
                aria-hidden="true"
              >
                <div className="relative h-0">
                  <span className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-danger" />
                  <span className="absolute left-0 right-0 top-0 h-[1.5px] bg-danger" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function EventCard({ event }: { event: AgendaEvent }) {
  const fmt = (d: Date) => d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  const isNow = event.status === 'now'
  const isCompleted = event.status === 'completed'

  return (
    <button
      type="button"
      className={`absolute left-[70px] right-3 rounded-md px-3 py-1.5 text-[12px] text-left cursor-pointer hover:shadow-card transition-shadow overflow-hidden ${VARIANT_CLASSES[event.status]}`}
      style={{ top: `${event.topPx}px`, height: `${event.heightPx}px` }}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-semibold">
          {fmt(event.start)} – {fmt(event.end)}
          {isNow && <span className="ml-2 text-[10px] uppercase tracking-wider">En cours</span>}
          {isCompleted && <span className="ml-2 text-[10px] uppercase tracking-wider text-warm-500">Terminée</span>}
        </span>
        <span className="font-serif text-[14px]">{event.priceEur}€</span>
      </div>
      <div className="truncate text-ink/90">{event.from} → {event.to}</div>
      <div className="text-[11px] text-warm-500 truncate">
        {event.postedByMe ? 'Postée par moi' : event.type === 'CPAM' ? 'Médical' : event.type === 'PRIVE' ? 'Privé' : 'TaxiLink'}
      </div>
    </button>
  )
}
