'use client'

interface Props {
  open: boolean
  busy: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function ConfirmDeleteCourseDialog({ open, busy, onCancel, onConfirm }: Props) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-ink/40"
      onClick={() => !busy && onCancel()}
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
            onClick={onCancel}
            disabled={busy}
            className="flex-1 h-12 rounded-xl bg-warm-50 border border-warm-200 text-warm-700 text-[14px] font-bold disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="flex-1 h-12 rounded-xl bg-danger text-paper text-[14px] font-extrabold disabled:opacity-50"
          >
            {busy ? 'Suppression…' : 'Supprimer'}
          </button>
        </div>
      </div>
    </div>
  )
}
