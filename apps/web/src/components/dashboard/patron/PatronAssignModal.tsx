'use client'
import { useState } from 'react'
import type { OrgDriver } from '@/services/patronCoursesService'

export interface AssignableCourse {
  id: string
  departure: string
  destination: string
}

interface Props {
  course: AssignableCourse | null
  drivers: OrgDriver[]
  onClose: () => void
  onAssign: (missionId: string, driverId: string) => Promise<void>
}

export function PatronAssignModal({ course, drivers, onClose, onAssign }: Props) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!course) return null

  const handleAssign = async (driverId: string) => {
    setSubmitting(true)
    setError(null)
    try {
      await onAssign(course.id, driverId)
      onClose()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[1000] flex items-center justify-center bg-ink/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="max-w-md w-full max-h-[80vh] rounded-2xl bg-paper dark:bg-night-surface border border-warm-200 dark:border-night-border p-6 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-extrabold text-ink dark:text-night-text">Assigner cette course</h3>
        <p className="text-xs text-warm-600 dark:text-night-text-soft mt-1">
          {course.departure} → {course.destination}
        </p>

        {error && <p className="mt-3 text-sm text-danger">{error}</p>}

        <div className="mt-4 space-y-1">
          {drivers.length === 0 ? (
            <p className="text-sm text-warm-600 dark:text-night-text-soft py-4 text-center">
              Aucun chauffeur dans votre organisation.
            </p>
          ) : (
            drivers.map((d) => (
              <button
                key={d.id}
                type="button"
                disabled={submitting}
                onClick={() => handleAssign(d.id)}
                className="w-full flex items-center justify-between gap-3 px-3 py-3 rounded-xl text-sm hover:bg-warm-100 dark:hover:bg-night-elevated transition-colors disabled:opacity-50"
              >
                <span className="flex items-center gap-2 text-ink dark:text-night-text font-medium">
                  <span className={`inline-block w-2 h-2 rounded-full ${d.is_online ? 'bg-green-500' : 'bg-warm-300'}`} />
                  {d.name}
                </span>
                <span className="text-xs text-warm-600 dark:text-night-text-soft">
                  {d.is_online ? 'En ligne' : 'Hors ligne'}
                </span>
              </button>
            ))
          )}
        </div>

        <button type="button" onClick={onClose} className="mt-4 w-full h-10 rounded-xl border border-warm-200 dark:border-night-border text-sm font-medium text-warm-700 dark:text-night-text-soft">
          Annuler
        </button>
      </div>
    </div>
  )
}
