'use client'
import type { AgendaDayGroup } from './useAgendaTab'
import { AgendaEventCard } from './AgendaEventCard'
import { AgendaInlineAdd } from './AgendaInlineAdd'

interface Props {
  group: AgendaDayGroup
  onTap: (id: string) => void
  onAdd: (date: Date) => void
  onMenu?: (id: string) => void
}

export function AgendaDayBlock({ group, onTap, onAdd, onMenu }: Props) {
  const summary = group.count === 0
    ? 'Rien de prévu'
    : `${group.count} course${group.count > 1 ? 's' : ''}${group.total > 0 ? ` · ${group.total.toFixed(0)} €` : ''}`

  return (
    <section id={`day-${group.key}`} className="mb-5 scroll-mt-24">
      <header className="flex items-end justify-between mb-2 px-1">
        <h3 className="text-[13px] font-bold text-ink leading-tight first-letter:uppercase">
          {group.label}
        </h3>
        <span className="text-[11px] font-semibold text-warm-500 tabular-nums">
          {summary}
        </span>
      </header>

      {group.events.length > 0 && (
        <div className="grid grid-cols-1 gap-2 mb-2 lg:grid-cols-2 xl:grid-cols-3">
          {group.events.map((e) => (
            <AgendaEventCard
              key={e.id}
              event={e}
              onTap={() => onTap(e.id)}
              onMenu={onMenu ? () => onMenu(e.id) : undefined}
            />
          ))}
        </div>
      )}

      <AgendaInlineAdd onClick={() => onAdd(group.date)} />
    </section>
  )
}
