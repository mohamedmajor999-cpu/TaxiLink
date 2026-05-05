'use client'
import { useMemo, useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { usePatronMarketplace } from './usePatronMarketplace'
import { PatronAssignModal, type AssignableCourse } from '@/components/dashboard/patron/PatronAssignModal'
import type { MarketplaceCourse } from '@/services/patronMarketplaceService'

type Filter = 'all' | 'public' | 'group'

export function PatronMarketplace() {
  const { items, orgDrivers, isLoading, error, assign } = usePatronMarketplace()
  const [filter, setFilter] = useState<Filter>('all')
  const [assigning, setAssigning] = useState<AssignableCourse | null>(null)

  const filtered = useMemo(() => {
    if (filter === 'public') return items.filter((i) => i.visibility === 'PUBLIC')
    if (filter === 'group') return items.filter((i) => i.visibility === 'GROUP')
    return items
  }, [items, filter])

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl md:text-3xl font-extrabold text-ink dark:text-night-text">Annonces</h1>
        <p className="text-sm text-warm-600 dark:text-night-text-soft mt-1">
          Courses disponibles publiquement et dans vos groupes
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <FilterChip active={filter === 'all'} onClick={() => setFilter('all')} label={`Toutes (${items.length})`} />
        <FilterChip active={filter === 'public'} onClick={() => setFilter('public')} label={`Public (${items.filter((i) => i.visibility === 'PUBLIC').length})`} />
        <FilterChip active={filter === 'group'} onClick={() => setFilter('group')} label={`Mes groupes (${items.filter((i) => i.visibility === 'GROUP').length})`} />
      </div>

      {isLoading ? (
        <p className="py-12 text-center text-warm-600 dark:text-night-text-soft text-sm">Chargement…</p>
      ) : error ? (
        <p className="py-12 text-center text-danger text-sm">Erreur : {error}</p>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center">
          <Icon name="campaign" size={32} />
          <p className="text-sm text-warm-700 dark:text-night-text-soft mt-2 font-medium">Aucune annonce disponible</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((c) => (
            <MarketplaceCard key={c.id} course={c} onAssign={() => setAssigning({ id: c.id, departure: c.departure, destination: c.destination })} />
          ))}
        </ul>
      )}

      <PatronAssignModal
        course={assigning}
        drivers={orgDrivers}
        onClose={() => setAssigning(null)}
        onAssign={assign}
      />
    </div>
  )
}

function FilterChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-9 px-3.5 rounded-full text-xs font-bold transition-colors ${active ? 'bg-ink dark:bg-night-brand text-paper dark:text-night-bg' : 'bg-paper dark:bg-night-surface border border-warm-200 dark:border-night-border text-warm-700 dark:text-night-text-soft hover:bg-warm-100 dark:hover:bg-night-elevated'}`}
    >
      {label}
    </button>
  )
}

function MarketplaceCard({ course, onAssign }: { course: MarketplaceCourse; onAssign: () => void }) {
  const visBadge = course.visibility === 'PUBLIC'
    ? { label: 'PUBLIC', cls: 'bg-blue-500/15 text-blue-700 dark:text-blue-400' }
    : { label: course.group_names[0] ? course.group_names[0].toUpperCase() : 'GROUPE', cls: 'bg-purple-500/15 text-purple-700 dark:text-purple-400' }
  const typeBadge = course.type === 'CPAM'
    ? { label: 'CPAM', cls: 'bg-brand/20 text-ink dark:text-night-brand' }
    : { label: 'PRIVÉ', cls: 'bg-warm-200 dark:bg-night-elevated text-warm-700 dark:text-night-text-soft' }

  return (
    <li className="rounded-2xl border border-warm-200 dark:border-night-border bg-paper dark:bg-night-surface p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${typeBadge.cls}`}>{typeBadge.label}</span>
          <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${visBadge.cls}`}>{visBadge.label}</span>
          <span className="text-xs text-warm-600 dark:text-night-text-soft">{course.scheduled_label}</span>
        </div>
        <p className="text-sm text-ink dark:text-night-text font-medium truncate">{course.departure} → {course.destination}</p>
        <p className="text-xs text-warm-600 dark:text-night-text-soft mt-0.5">
          Posté par {course.shared_by_name}
          {course.patient_name && ` · Patient ${course.patient_name}`}
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {course.price_eur != null && (
          <span className="text-base font-extrabold text-ink dark:text-night-text tabular-nums">{course.price_eur} €</span>
        )}
        <button type="button" onClick={onAssign} className="h-9 px-4 rounded-xl bg-ink dark:bg-night-brand text-paper dark:text-night-bg text-sm font-bold hover:opacity-90">
          Assigner
        </button>
      </div>
    </li>
  )
}
