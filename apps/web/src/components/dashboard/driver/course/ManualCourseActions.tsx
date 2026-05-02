'use client'
import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'

interface Props {
  onEdit: () => void
  onConfirmDelete: () => Promise<void> | void
  removing: boolean
}

export function ManualCourseActions({ onEdit, onConfirmDelete, removing }: Props) {
  const [confirm, setConfirm] = useState(false)

  return (
    <>
      <div className="flex items-stretch gap-2 mt-3">
        <button
          type="button"
          onClick={onEdit}
          className="flex-1 inline-flex items-center justify-center gap-2 h-12 rounded-2xl border border-warm-200 bg-paper text-ink text-[14px] font-semibold hover:bg-warm-50 transition-colors"
        >
          <Pencil className="w-4 h-4" strokeWidth={2} />
          Modifier
        </button>
        <button
          type="button"
          onClick={() => setConfirm(true)}
          className="flex-1 inline-flex items-center justify-center gap-2 h-12 rounded-2xl border border-danger/40 bg-paper text-danger text-[14px] font-semibold hover:bg-danger-soft transition-colors"
        >
          <Trash2 className="w-4 h-4" strokeWidth={2} />
          Supprimer
        </button>
      </div>

      {confirm && (
        <div
          className="fixed inset-0 z-[80] flex items-end md:items-center justify-center bg-ink/40"
          onClick={() => !removing && setConfirm(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-paper w-full max-w-sm rounded-t-3xl md:rounded-3xl p-5 shadow-soft"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-[18px] font-extrabold text-ink mb-1">Supprimer la course ?</h3>
            <p className="text-[13px] text-warm-600 mb-4">
              Cette course sera retirée de votre agenda. Action irréversible.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirm(false)}
                disabled={removing}
                className="flex-1 h-12 rounded-xl bg-warm-50 border border-warm-200 text-warm-700 text-[14px] font-bold disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={async () => {
                  await onConfirmDelete()
                  setConfirm(false)
                }}
                disabled={removing}
                className="flex-1 h-12 rounded-xl bg-danger text-paper text-[14px] font-extrabold disabled:opacity-50"
              >
                {removing ? 'Suppression…' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
