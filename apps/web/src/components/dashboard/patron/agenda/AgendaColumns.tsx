'use client'
import { Icon } from '@/components/ui/Icon'
import type { AgendaBlock, AgendaDriverRow, UnassignedCourse } from '@/services/patronAgendaService'

export function UnassignedSection({ items, onAssign, onAutoDispatch }: { items: UnassignedCourse[]; onAssign: (c: UnassignedCourse) => void; onAutoDispatch?: () => void }) {
  return (
    <section className="rounded-2xl border-2 border-dashed border-brand bg-brand/5 dark:bg-brand/10 p-4">
      <header className="flex items-center gap-2 mb-3">
        <Icon name="inbox" size={18} />
        <h2 className="text-sm font-bold text-ink dark:text-night-text">À assigner</h2>
        <span className="text-[11px] font-bold text-ink dark:text-night-brand tabular-nums bg-brand/30 px-2 py-0.5 rounded-full">
          {items.length}
        </span>
        {onAutoDispatch && items.length > 0 && (
          <button
            type="button"
            onClick={onAutoDispatch}
            className="ml-auto h-8 px-3 rounded-lg bg-ink dark:bg-night-brand text-paper dark:text-night-bg text-xs font-bold hover:opacity-90 flex items-center gap-1.5"
          >
            <Icon name="auto_awesome" size={14} />
            Assigner auto
          </button>
        )}
      </header>
      {items.length === 0 ? (
        <div className="py-6 text-center">
          <Icon name="task_alt" size={28} />
          <p className="text-xs text-warm-700 dark:text-night-text-soft mt-2 font-medium">Tout est dispatché</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {items.map((c) => <UnassignedCard key={c.id} course={c} onAssign={onAssign} />)}
        </div>
      )}
    </section>
  )
}

function UnassignedCard({ course, onAssign }: { course: UnassignedCourse; onAssign: (c: UnassignedCourse) => void }) {
  const typeClass = course.type === 'CPAM'
    ? 'bg-brand/20 text-ink dark:text-night-brand'
    : 'bg-warm-200 dark:bg-night-elevated text-warm-700 dark:text-night-text-soft'

  return (
    <div className="rounded-xl border border-warm-200 dark:border-night-border bg-paper dark:bg-night-surface p-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-bold text-ink dark:text-night-text tabular-nums">
          {formatTime(course.startH)} → {formatTime(course.endH)}
        </span>
        <span className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded-md font-bold ${typeClass}`}>
          {course.type}
        </span>
      </div>
      <p className="text-xs text-warm-700 dark:text-night-text-soft leading-snug line-clamp-2">
        {short(course.departure)} → {short(course.destination)}
      </p>
      <div className="flex items-center justify-between mt-2 gap-2">
        <span className="text-xs font-bold text-ink dark:text-night-text tabular-nums">
          {course.price_eur != null ? `${course.price_eur} €` : '—'}
        </span>
        <button
          type="button"
          onClick={() => onAssign(course)}
          className="h-7 px-3 rounded-lg bg-ink dark:bg-night-brand text-paper dark:text-night-bg text-xs font-bold hover:opacity-90"
        >
          Assigner
        </button>
      </div>
    </div>
  )
}

export function DriverColumn({ row }: { row: AgendaDriverRow }) {
  const sorted = [...row.blocks].sort((a, b) => a.startH - b.startH)
  return (
    <section className="rounded-2xl border border-warm-200 dark:border-night-border bg-paper dark:bg-night-surface flex flex-col min-h-[220px]">
      <header className="px-4 py-3 border-b border-warm-200 dark:border-night-border flex items-center justify-between">
        <h2 className="text-sm font-bold text-ink dark:text-night-text truncate">{row.name}</h2>
        <span className="text-[11px] text-warm-600 dark:text-night-text-soft tabular-nums shrink-0 ml-2">
          {sorted.length} course{sorted.length > 1 ? 's' : ''}
        </span>
      </header>
      <div className="flex-1 p-3 space-y-2">
        {sorted.length === 0 ? (
          <p className="text-xs text-warm-600 dark:text-night-text-soft py-6 text-center">Aucune course</p>
        ) : (
          sorted.map((b) => <MissionCard key={b.id} block={b} />)
        )}
      </div>
    </section>
  )
}

function MissionCard({ block }: { block: AgendaBlock }) {
  const cardClass =
    block.status === 'completed'
      ? 'bg-warm-100 dark:bg-night-elevated border-warm-200 dark:border-night-border opacity-70'
      : block.status === 'in-progress'
        ? 'bg-brand/15 dark:bg-brand/20 border-brand'
        : 'bg-paper dark:bg-night-bg border-warm-200 dark:border-night-border'

  const statusLabel = block.status === 'completed' ? 'Terminée' : block.status === 'in-progress' ? 'En cours' : 'Prévue'
  const statusClass =
    block.status === 'completed'
      ? 'text-warm-600 dark:text-night-text-soft'
      : block.status === 'in-progress'
        ? 'text-ink dark:text-night-brand font-bold'
        : 'text-warm-700 dark:text-night-text-soft'

  const typeClass =
    block.type === 'CPAM'
      ? 'bg-brand/20 text-ink dark:text-night-brand'
      : 'bg-warm-200 dark:bg-night-elevated text-warm-700 dark:text-night-text-soft'

  return (
    <div className={`rounded-xl border p-3 transition-colors ${cardClass}`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-bold text-ink dark:text-night-text tabular-nums">
          {formatTime(block.startH)} → {formatTime(block.endH)}
        </span>
        <span className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded-md font-bold ${typeClass}`}>
          {block.type}
        </span>
      </div>
      <p className="text-xs text-warm-700 dark:text-night-text-soft leading-snug line-clamp-2">{block.label}</p>
      <p className={`text-[10px] uppercase tracking-wide mt-1.5 ${statusClass}`}>{statusLabel}</p>
    </div>
  )
}

function formatTime(h: number): string {
  const hours = Math.floor(h)
  const minutes = Math.round((h - hours) * 60)
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

function short(s: string): string {
  return s.split(',')[0].trim() || s
}
