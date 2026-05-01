'use client'
import { AlertCircle } from 'lucide-react'
import { useMissionEditSheet } from './useMissionEditSheet'
import type { Mission } from '@/lib/supabase/types'

interface Props {
  onUpdated?: (m: Mission) => void
}

export function MissionEditSheet({ onUpdated }: Props) {
  const s = useMissionEditSheet(onUpdated)
  if (!s.open || !s.form) return null

  const isPriceMode = s.mode === 'price'
  const title = isPriceMode ? 'Modifier le prix final' : 'Corriger les infos'
  const subtitle = s.mission
    ? `${s.mission.departure} → ${s.mission.destination}`
    : ''
  const submitLabel = isPriceMode ? 'Enregistrer le prix' : 'Enregistrer'

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end md:items-center justify-center bg-ink/40"
      onClick={s.close}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="bg-paper w-full max-w-lg rounded-t-3xl md:rounded-3xl max-h-[92vh] overflow-y-auto shadow-soft"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 pt-3 pb-1">
          <div className="w-9 h-1 rounded-full bg-warm-200 mx-auto mb-3" aria-hidden="true" />
          <h2 className="text-[18px] font-extrabold text-ink tracking-tight">{title}</h2>
          {subtitle && (
            <p className="text-[12.5px] text-warm-500 mt-1 truncate">{subtitle}</p>
          )}
        </div>

        <div className="px-5 py-4 space-y-3">
          {s.editableFields.address && (
            <Field label="Adresse de prise en charge">
              <input
                type="text"
                value={s.form.departure}
                onChange={(e) => s.setField('departure', e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-warm-200 bg-paper text-[15px] text-ink focus:outline-none focus:border-ink transition-colors"
                disabled={s.busy}
              />
            </Field>
          )}

          {s.editableFields.address && (
            <Field label="Adresse de destination">
              <input
                type="text"
                value={s.form.destination}
                onChange={(e) => s.setField('destination', e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-warm-200 bg-paper text-[15px] text-ink focus:outline-none focus:border-ink transition-colors"
                disabled={s.busy}
              />
            </Field>
          )}

          {s.editableFields.phone && (
            <Field label="Téléphone du patient">
              <input
                type="tel"
                value={s.form.phone}
                onChange={(e) => s.setField('phone', e.target.value)}
                placeholder="06 12 34 56 78"
                className="w-full h-12 px-4 rounded-xl border border-warm-200 bg-paper text-[15px] text-ink focus:outline-none focus:border-ink transition-colors"
                disabled={s.busy}
              />
            </Field>
          )}

          {s.editableFields.price && (
            <Field
              label="Prix final"
              hint={s.initial?.priceEur ? `Tarif annoncé : ${s.initial.priceEur} €` : undefined}
            >
              <div className={`flex items-center gap-2 px-4 rounded-xl border bg-paper transition-colors ${s.busy ? 'border-warm-200 opacity-60' : 'border-warm-200 focus-within:border-ink'}`}>
                <input
                  type="text"
                  inputMode="decimal"
                  value={s.form.priceEur}
                  onChange={(e) => s.setField('priceEur', e.target.value)}
                  className="flex-1 h-12 bg-transparent text-[22px] font-extrabold text-ink focus:outline-none"
                  disabled={s.busy}
                />
                <span className="text-[20px] font-extrabold text-ink">€</span>
              </div>
            </Field>
          )}

          {s.error && (
            <div className="flex items-start gap-2 text-[12.5px] text-danger bg-danger-soft border border-danger/30 px-3 py-2 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {s.error}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-paper px-5 pt-3 pb-5 border-t border-warm-100 flex gap-2">
          <button
            type="button"
            onClick={s.close}
            disabled={s.busy}
            className="px-5 h-12 rounded-xl bg-warm-50 border border-warm-200 text-warm-700 text-[14px] font-bold disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={s.submit}
            disabled={s.busy || !s.dirty}
            className="flex-1 h-12 rounded-xl bg-ink text-paper text-[14px] font-extrabold disabled:opacity-50"
          >
            {s.busy ? 'Enregistrement…' : submitLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-extrabold uppercase tracking-[0.06em] text-warm-700 mb-1.5">
        {label}
      </label>
      {children}
      {hint && <p className="text-[11.5px] text-warm-500 mt-1">{hint}</p>}
    </div>
  )
}
