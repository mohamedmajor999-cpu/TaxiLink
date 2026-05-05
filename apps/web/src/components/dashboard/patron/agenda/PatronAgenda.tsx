'use client'
import { useEffect, useRef, useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { useCurrentOrg } from '@/hooks/useCurrentOrg'
import { usePatronAgenda } from './usePatronAgenda'
import { UnassignedSection, DriverColumn } from './AgendaColumns'
import { AutoDispatchModal } from './AutoDispatchModal'
import { dispatch, type DispatchSuggestion } from './dispatchAlgorithm'
import { PatronAssignModal, type AssignableCourse } from '@/components/dashboard/patron/PatronAssignModal'
import type { UnassignedCourse } from '@/services/patronAgendaService'

export function PatronAgenda() {
  const [dayIso, setDayIso] = useState<string>(() => toIso(new Date()))
  const [assigning, setAssigning] = useState<AssignableCourse | null>(null)
  const [suggestions, setSuggestions] = useState<DispatchSuggestion[] | null>(null)
  const [autoMsg, setAutoMsg] = useState<string | null>(null)
  const triedRef = useRef<Set<string>>(new Set())
  const { rows, unassigned, orgDrivers, fleet, isLoading, error, assign, assignBatch } = usePatronAgenda(dayIso)
  const { organization } = useCurrentOrg()
  const autoEnabled = !!organization?.auto_dispatch_enabled

  const runAutoDispatch = () => {
    setSuggestions(dispatch({ courses: unassigned, drivers: fleet, rows }))
  }

  // Auto-dispatch silencieux : déclenché quand de nouvelles courses non-assignées
  // apparaissent ET que le toggle est activé. Marque les IDs déjà tentés pour
  // ne pas spammer si aucun chauffeur n'était libre.
  useEffect(() => {
    if (!autoEnabled || fleet.length === 0 || unassigned.length === 0) return
    const newCourses = unassigned.filter((c) => !triedRef.current.has(c.id))
    if (newCourses.length === 0) return
    newCourses.forEach((c) => triedRef.current.add(c.id))
    const sugs = dispatch({ courses: newCourses, drivers: fleet, rows })
    const toAssign = sugs
      .filter((s): s is DispatchSuggestion & { driverId: string } => s.driverId != null)
      .map((s) => ({ courseId: s.courseId, driverId: s.driverId }))
    if (toAssign.length === 0) return
    assignBatch(toAssign)
      .then(() => {
        setAutoMsg(`✨ ${toAssign.length} course${toAssign.length > 1 ? 's' : ''} assignée${toAssign.length > 1 ? 's' : ''} automatiquement`)
        setTimeout(() => setAutoMsg(null), 5000)
      })
      .catch((e) => {
        setAutoMsg(`Auto-dispatch en erreur : ${(e as Error).message}`)
        setTimeout(() => setAutoMsg(null), 5000)
      })
  }, [autoEnabled, unassigned, fleet, rows, assignBatch])

  const totalAssigned = rows.reduce((s, r) => s + r.blocks.length, 0)

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-ink dark:text-night-text">Planning</h1>
          <p className="text-sm text-warm-600 dark:text-night-text-soft mt-1">
            {unassigned.length} à assigner · {totalAssigned} affectée{totalAssigned > 1 ? 's' : ''}
            {autoEnabled && <span className="ml-2 text-[10px] font-bold text-ink dark:text-night-brand bg-brand/20 px-1.5 py-0.5 rounded uppercase tracking-wide">Auto-dispatch ON</span>}
          </p>
        </div>
        <DateSelector dayIso={dayIso} onChange={setDayIso} />
      </header>

      {autoMsg && (
        <div className="rounded-xl border border-brand bg-brand/10 px-4 py-2.5 text-sm font-medium text-ink dark:text-night-text flex items-center gap-2">
          <Icon name="auto_awesome" size={16} />
          {autoMsg}
        </div>
      )}

      {isLoading ? (
        <PlanningSkeleton />
      ) : error ? (
        <p className="py-12 text-center text-danger text-sm">Erreur : {error}</p>
      ) : rows.length === 0 && unassigned.length === 0 ? (
        <p className="text-sm text-warm-600 dark:text-night-text-soft py-12 text-center">
          Aucun chauffeur ni course pour cette journée.
        </p>
      ) : (
        <>
          <UnassignedSection
            items={unassigned}
            onAssign={(c: UnassignedCourse) => setAssigning(c)}
            onAutoDispatch={fleet.length > 0 ? runAutoDispatch : undefined}
          />
          {rows.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {rows.map((row) => (
                <DriverColumn key={row.driverId} row={row} />
              ))}
            </div>
          )}
        </>
      )}

      <PatronAssignModal
        course={assigning}
        drivers={orgDrivers}
        onClose={() => setAssigning(null)}
        onAssign={assign}
      />

      <AutoDispatchModal
        open={suggestions !== null}
        onClose={() => setSuggestions(null)}
        suggestions={suggestions ?? []}
        courses={unassigned}
        drivers={orgDrivers}
        onConfirm={assignBatch}
      />
    </div>
  )
}

function DateSelector({ dayIso, onChange }: { dayIso: string; onChange: (iso: string) => void }) {
  const date = fromIso(dayIso)
  const today = toIso(new Date())
  const isToday = today === dayIso
  const label = date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

  const shift = (days: number) => {
    const d = fromIso(dayIso)
    d.setDate(d.getDate() + days)
    onChange(toIso(d))
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center rounded-xl border border-warm-200 dark:border-night-border bg-paper dark:bg-night-surface overflow-hidden">
        <button type="button" onClick={() => shift(-1)} aria-label="Jour précédent" className="px-2 py-1.5 hover:bg-warm-100 dark:hover:bg-night-elevated text-ink dark:text-night-text">
          <Icon name="chevron_left" size={20} />
        </button>
        <div className="px-2 py-1.5 text-sm font-bold text-ink dark:text-night-text capitalize tabular-nums min-w-[180px] text-center">
          {label}
        </div>
        <button type="button" onClick={() => shift(1)} aria-label="Jour suivant" className="px-2 py-1.5 hover:bg-warm-100 dark:hover:bg-night-elevated text-ink dark:text-night-text">
          <Icon name="chevron_right" size={20} />
        </button>
      </div>
      <input
        type="date"
        value={dayIso}
        onChange={(e) => e.target.value && onChange(e.target.value)}
        className="rounded-xl border border-warm-200 dark:border-night-border bg-paper dark:bg-night-surface px-3 py-1.5 text-sm text-ink dark:text-night-text"
      />
      {!isToday && (
        <button
          type="button"
          onClick={() => onChange(today)}
          className="rounded-xl border border-warm-200 dark:border-night-border bg-paper dark:bg-night-surface px-3 py-1.5 text-sm font-medium text-ink dark:text-night-text hover:bg-warm-100 dark:hover:bg-night-elevated"
        >
          Aujourd&apos;hui
        </button>
      )}
    </div>
  )
}

function toIso(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function fromIso(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function PlanningSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-32 rounded-2xl bg-warm-100 dark:bg-night-elevated" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-48 rounded-2xl bg-warm-100 dark:bg-night-elevated" />
        ))}
      </div>
    </div>
  )
}
