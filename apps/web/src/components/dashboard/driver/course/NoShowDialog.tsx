'use client'
import { X } from 'lucide-react'
import { NO_SHOW_REASONS, useNoShowDialog } from './useNoShowDialog'

interface Props {
  open: boolean
  submitting: boolean
  onClose: () => void
  onSubmit: (reason: string) => void
}

export function NoShowDialog({ open, submitting, onClose, onSubmit }: Props) {
  const { selected, setSelected, customText, setCustomText, canSubmit, handleConfirm } =
    useNoShowDialog({ submitting, onSubmit })

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="noshow-title"
      onClick={onClose}
    >
      <div
        className="w-full md:max-w-md bg-paper rounded-t-3xl md:rounded-3xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-warm-200">
          <div>
            <h2 id="noshow-title" className="text-[18px] font-bold text-ink tracking-tight">
              Patient absent
            </h2>
            <p className="text-[11.5px] text-warm-500 mt-0.5">
              La course sera clôturée mais ne comptera pas dans votre CA.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="w-9 h-9 rounded-full hover:bg-warm-50 flex items-center justify-center"
          >
            <X className="w-4 h-4 text-ink" strokeWidth={2} />
          </button>
        </div>

        <div className="p-5 space-y-2 max-h-[60vh] overflow-y-auto">
          <p className="text-[13px] text-warm-600 mb-3">Choisissez un motif (obligatoire) :</p>
          {NO_SHOW_REASONS.map((r) => (
            <label
              key={r.key}
              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                selected === r.key ? 'border-ink bg-warm-50' : 'border-warm-200 hover:bg-warm-50'
              }`}
            >
              <input
                type="radio"
                name="noshow-reason"
                value={r.key}
                checked={selected === r.key}
                onChange={() => setSelected(r.key)}
                className="w-4 h-4 accent-ink"
              />
              <span className="text-[14px] font-medium text-ink">{r.label}</span>
            </label>
          ))}
          {selected === 'other' && (
            <textarea
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              rows={3}
              maxLength={200}
              placeholder="Précisez le motif…"
              className="w-full mt-2 p-3 rounded-xl border border-warm-300 bg-paper text-[14px] resize-none focus:outline-none focus:border-ink"
            />
          )}
        </div>

        <div className="p-5 pt-0 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="h-12 rounded-xl border border-warm-300 bg-paper text-ink text-[14px] font-semibold hover:bg-warm-50 disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canSubmit}
            className="h-12 rounded-xl bg-ink text-paper text-[14px] font-semibold hover:brightness-110 disabled:opacity-50"
          >
            {submitting ? 'Envoi…' : 'Confirmer l\'absence'}
          </button>
        </div>
      </div>
    </div>
  )
}
