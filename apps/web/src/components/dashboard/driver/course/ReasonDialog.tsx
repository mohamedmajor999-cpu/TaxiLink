'use client'
import { X, AlertCircle } from 'lucide-react'
import { useReasonDialog } from './useReasonDialog'

export interface ReasonOption {
  key: string
  label: string
}

interface Props {
  open: boolean
  submitting: boolean
  title: string
  helperText?: string
  reasons: ReadonlyArray<ReasonOption>
  submitLabel: string
  submittingLabel: string
  /** Style du bouton de confirmation : "danger" pour annulation, "ink" pour no-show. */
  variant?: 'danger' | 'ink'
  /** Sous-titre optionnel (ex: NoShow explique l'impact CA). */
  subtitle?: string
  error?: string | null
  onClose: () => void
  onSubmit: (reason: string) => void
}

// Modal generique radio + textarea "autre" + bouton confirm. Factorise
// CancelMissionDialog et NoShowDialog (etaient 2 fichiers ~100 lignes
// identiques sauf liste de raisons et libelles).
export function ReasonDialog({
  open, submitting, title, helperText, reasons,
  submitLabel, submittingLabel, variant = 'danger', subtitle, error,
  onClose, onSubmit,
}: Props) {
  const { selected, setSelected, customText, setCustomText, canSubmit, handleConfirm } =
    useReasonDialog({ reasons, submitting, onSubmit })

  if (!open) return null

  const confirmClass = variant === 'danger'
    ? 'bg-danger text-paper hover:brightness-95'
    : 'bg-ink text-paper hover:brightness-110'

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reason-title"
      onClick={onClose}
    >
      <div
        className="w-full md:max-w-md bg-paper rounded-t-3xl md:rounded-3xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-5 border-b border-warm-200">
          <div>
            <h2 id="reason-title" className="text-[18px] font-bold text-ink tracking-tight">{title}</h2>
            {subtitle && <p className="text-[11.5px] text-warm-500 mt-0.5">{subtitle}</p>}
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
          <p className="text-[13px] text-warm-600 mb-3">{helperText ?? 'Choisissez un motif (obligatoire) :'}</p>
          {reasons.map((r) => (
            <label
              key={r.key}
              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                selected === r.key ? 'border-ink bg-warm-50' : 'border-warm-200 hover:bg-warm-50'
              }`}
            >
              <input
                type="radio"
                name="reason"
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
          {error && (
            <div className="mt-2 flex items-start gap-2 text-[12.5px] text-danger bg-danger-soft border border-danger/30 px-3 py-2 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
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
            className={`h-12 rounded-xl text-[14px] font-semibold disabled:opacity-50 ${confirmClass}`}
          >
            {submitting ? submittingLabel : submitLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export const CANCEL_REASONS: ReadonlyArray<ReasonOption> = [
  { key: 'delay', label: 'Retard important' },
  { key: 'vehicle', label: 'Véhicule immobilisé' },
  { key: 'personal', label: 'Urgence personnelle' },
  { key: 'address', label: 'Adresse introuvable' },
  { key: 'other', label: 'Autre' },
]

export const NO_SHOW_REASONS: ReadonlyArray<ReasonOption> = [
  { key: 'absent', label: 'Patient absent au point de RDV' },
  { key: 'refused', label: 'Patient refuse de monter' },
  { key: 'wrong_address', label: 'Adresse introuvable / erronée' },
  { key: 'other_taxi', label: 'Patient déjà parti (autre taxi)' },
  { key: 'other', label: 'Autre' },
]
