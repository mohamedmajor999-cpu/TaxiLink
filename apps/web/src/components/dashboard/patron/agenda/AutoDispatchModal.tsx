'use client'
import { useMemo, useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import type { DispatchSuggestion } from './dispatchAlgorithm'
import type { UnassignedCourse } from '@/services/patronAgendaService'
import type { OrgDriver } from '@/services/patronCoursesService'

interface Props {
  open: boolean
  onClose: () => void
  suggestions: DispatchSuggestion[]
  courses: UnassignedCourse[]
  drivers: OrgDriver[]
  onConfirm: (acceptedAssignments: { courseId: string; driverId: string }[]) => Promise<void>
}

export function AutoDispatchModal({ open, onClose, suggestions, courses, drivers, onConfirm }: Props) {
  const [rejected, setRejected] = useState<Set<string>>(new Set())
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const courseById = useMemo(() => new Map(courses.map((c) => [c.id, c])), [courses])
  const driverNameById = useMemo(() => new Map(drivers.map((d) => [d.id, d.name])), [drivers])

  if (!open) return null

  const assignable = suggestions.filter((s) => s.driverId != null && !rejected.has(s.courseId))
  const total = suggestions.filter((s) => s.driverId != null).length
  const skipped = suggestions.filter((s) => s.driverId == null).length

  const toggle = (courseId: string) => {
    setRejected((prev) => {
      const next = new Set(prev)
      if (next.has(courseId)) next.delete(courseId)
      else next.add(courseId)
      return next
    })
  }

  const handleConfirm = async () => {
    if (assignable.length === 0) { onClose(); return }
    setSubmitting(true)
    setError(null)
    try {
      await onConfirm(assignable.map((s) => ({ courseId: s.courseId, driverId: s.driverId! })))
      setRejected(new Set())
      onClose()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[1000] flex items-center justify-center bg-ink/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="max-w-2xl w-full max-h-[85vh] rounded-2xl bg-paper dark:bg-night-surface border border-warm-200 dark:border-night-border flex flex-col" onClick={(e) => e.stopPropagation()}>
        <header className="px-6 py-4 border-b border-warm-200 dark:border-night-border">
          <h3 className="text-lg font-extrabold text-ink dark:text-night-text flex items-center gap-2">
            <Icon name="auto_awesome" size={20} />
            Suggestions de dispatch
          </h3>
          <p className="text-xs text-warm-600 dark:text-night-text-soft mt-1">
            {total} affectation{total > 1 ? 's' : ''} proposée{total > 1 ? 's' : ''}
            {skipped > 0 && ` · ${skipped} sans chauffeur libre`}
          </p>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-3">
          {suggestions.length === 0 ? (
            <p className="text-sm text-warm-600 dark:text-night-text-soft py-6 text-center">Aucune course à dispatcher.</p>
          ) : (
            <ul className="divide-y divide-warm-100 dark:divide-night-border">
              {suggestions.map((s) => {
                const course = courseById.get(s.courseId)
                const driverName = s.driverId ? driverNameById.get(s.driverId) ?? 'Chauffeur' : null
                const isRejected = rejected.has(s.courseId)
                const noDriver = s.driverId == null
                return (
                  <li key={s.courseId} className={`py-3 flex items-start gap-3 ${noDriver ? 'opacity-60' : ''}`}>
                    <input
                      type="checkbox"
                      checked={!noDriver && !isRejected}
                      disabled={noDriver}
                      onChange={() => toggle(s.courseId)}
                      className="mt-1 w-4 h-4 accent-ink dark:accent-night-brand"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-ink dark:text-night-text font-medium truncate">
                        {course ? `${short(course.departure)} → ${short(course.destination)}` : s.courseId}
                      </p>
                      <p className="text-xs text-warm-600 dark:text-night-text-soft mt-0.5">
                        {course && `${formatTime(course.startH)} · `}
                        {driverName ? <><span className="font-bold text-ink dark:text-night-text">→ {driverName}</span> · {s.reasons.join(' · ')}</> : s.reasons.join(' · ')}
                      </p>
                    </div>
                    {!noDriver && (
                      <span className="text-[10px] font-bold text-warm-600 dark:text-night-text-soft tabular-nums shrink-0">
                        {s.score}/100
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {error && <p className="px-6 pb-2 text-sm text-danger">{error}</p>}

        <footer className="px-6 py-4 border-t border-warm-200 dark:border-night-border flex items-center justify-between gap-3">
          <button type="button" onClick={onClose} disabled={submitting} className="text-sm font-medium text-warm-700 dark:text-night-text-soft px-4 py-2 hover:underline disabled:opacity-50">
            Annuler
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting || assignable.length === 0}
            className="h-10 px-5 rounded-xl bg-ink dark:bg-night-brand text-paper dark:text-night-bg text-sm font-bold disabled:opacity-50 hover:opacity-90"
          >
            {submitting ? 'Assignation…' : `Assigner les ${assignable.length} sélectionnées`}
          </button>
        </footer>
      </div>
    </div>
  )
}

function short(s: string): string {
  return s.split(',')[0].trim() || s
}

function formatTime(h: number): string {
  const hh = Math.floor(h)
  const mm = Math.round((h - hh) * 60)
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}
