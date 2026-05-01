'use client'
import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'

interface Props {
  open: boolean
  initialPrice: number | null
  saving: boolean
  onClose: () => void
  onSave: (price: number | null) => void | Promise<void>
}

export function EditPriceDialog({ open, initialPrice, saving, onClose, onSave }: Props) {
  const [value, setValue] = useState(initialPrice != null ? String(initialPrice) : '')
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const submit = async () => {
    const trimmed = value.trim().replace(',', '.')
    if (trimmed === '') {
      // Saisie vide -> on remet le prix a null (effacement)
      await onSave(null)
      return
    }
    const num = Number(trimmed)
    if (!Number.isFinite(num) || num < 0) {
      setError('Montant invalide')
      return
    }
    setError(null)
    await onSave(num)
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/40 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-paper w-full max-w-md rounded-t-2xl sm:rounded-2xl shadow-soft"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-warm-200">
          <h2 className="text-[16px] font-extrabold text-ink tracking-tight">
            Prix réel encaissé
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="w-8 h-8 rounded-xl bg-warm-100 flex items-center justify-center text-ink hover:bg-warm-200"
          >
            <X className="w-4 h-4" strokeWidth={1.8} />
          </button>
        </div>
        <div className="px-5 py-4">
          <p className="text-[12.5px] text-warm-600 mb-4 leading-snug">
            Saisissez le montant que vous avez réellement encaissé pour cette course. Cette valeur remplace l’estimation et alimente votre historique et vos KPI.
          </p>
          <label className="block">
            <span className="text-[11px] font-bold uppercase tracking-wider text-warm-500 mb-1.5 block">Montant</span>
            <div className="relative">
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                autoFocus
                value={value}
                onChange={(e) => { setValue(e.target.value); setError(null) }}
                placeholder="0,00"
                className="w-full h-12 pl-3 pr-10 rounded-2xl border border-warm-200 focus:border-ink focus:outline-none text-[16px] text-ink tabular-nums tracking-tight transition-colors"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[14px] font-semibold text-warm-500">€</span>
            </div>
          </label>
          {error && <p className="text-[12px] text-danger mt-2">{error}</p>}
          <div className="flex gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-12 rounded-2xl border border-warm-200 bg-paper text-ink text-[14px] font-semibold hover:bg-warm-50"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={saving}
              className="flex-[2] h-12 rounded-2xl bg-ink text-paper text-[14px] font-bold hover:brightness-110 disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />}
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
