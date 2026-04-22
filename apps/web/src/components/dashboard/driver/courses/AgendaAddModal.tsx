'use client'
import { X, Loader2 } from 'lucide-react'
import type { Mission } from '@/lib/supabase/types'
import { useAgendaAddModal, type ManualType } from './useAgendaAddModal'

const FIELD = 'w-full h-12 px-4 rounded-xl border border-warm-200 bg-paper text-[15px] text-ink focus:outline-none focus:border-ink transition-colors'
const TEXTAREA = 'w-full px-4 py-3 rounded-xl border border-warm-200 bg-paper text-[15px] text-ink focus:outline-none focus:border-ink transition-colors resize-none'

const TYPE_OPTIONS: { value: ManualType; label: string; sub: string }[] = [
  { value: 'PRIVE', label: 'Privé', sub: 'Particulier' },
  { value: 'CPAM', label: 'Médical', sub: 'CPAM / AMO' },
  { value: 'TAXILINK', label: 'TaxiLink', sub: 'Réseau' },
]

interface Props {
  selectedDate: Date
  onClose: () => void
  onAdded: (m: Mission) => void
}

export function AgendaAddModal({ selectedDate, onClose, onAdded }: Props) {
  const m = useAgendaAddModal(selectedDate, (mission) => {
    onAdded(mission)
    onClose()
  })

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-ink/40"
      onClick={onClose}
    >
      <div
        className="bg-paper w-full max-w-lg rounded-t-2xl md:rounded-2xl max-h-[92vh] overflow-y-auto shadow-soft"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="sticky top-0 bg-paper z-10 px-5 pt-5 pb-4 border-b border-warm-200 flex items-center justify-between">
          <h2 className="text-[18px] font-bold text-ink tracking-tight">Ajouter une course</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-warm-100 flex items-center justify-center hover:bg-warm-200 transition-colors"
          >
            <X className="w-4 h-4" strokeWidth={1.8} />
          </button>
        </header>

        <div className="px-5 pt-5 pb-8 space-y-5">
          {/* Type */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-warm-500 mb-2">Type de course</p>
            <div className="grid grid-cols-3 gap-2">
              {TYPE_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => m.set('type', o.value)}
                  className={`flex flex-col items-center py-3 px-2 rounded-xl text-center transition-colors ${
                    m.form.type === o.value
                      ? 'bg-ink text-paper'
                      : 'bg-warm-100 text-ink hover:bg-warm-200'
                  }`}
                >
                  <span className="text-[14px] font-bold">{o.label}</span>
                  <span className={`text-[11px] mt-0.5 ${m.form.type === o.value ? 'text-paper/60' : 'text-warm-500'}`}>
                    {o.sub}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Date + heure */}
          <div className="grid grid-cols-2 gap-3">
            <FieldWrap label="Date">
              <input
                type="date"
                value={m.form.date}
                onChange={(e) => m.set('date', e.target.value)}
                className={FIELD}
              />
            </FieldWrap>
            <FieldWrap label="Heure">
              <input
                type="time"
                value={m.form.time}
                onChange={(e) => m.set('time', e.target.value)}
                className={FIELD}
              />
            </FieldWrap>
          </div>

          {/* Départ */}
          <FieldWrap label="Départ">
            <input
              type="text"
              value={m.form.departure}
              onChange={(e) => m.set('departure', e.target.value)}
              placeholder="Adresse de départ"
              className={FIELD}
            />
          </FieldWrap>

          {/* Arrivée */}
          <FieldWrap label="Arrivée">
            <input
              type="text"
              value={m.form.destination}
              onChange={(e) => m.set('destination', e.target.value)}
              placeholder="Adresse d'arrivée"
              className={FIELD}
            />
          </FieldWrap>

          {/* Prix */}
          <FieldWrap label="Prix estimé (€)">
            <input
              type="number"
              inputMode="decimal"
              value={m.form.priceEur}
              onChange={(e) => m.set('priceEur', e.target.value)}
              placeholder="Ex : 35"
              className={FIELD}
            />
          </FieldWrap>

          {/* Patient — CPAM uniquement */}
          {m.form.type === 'CPAM' && (
            <FieldWrap label="Nom du patient">
              <input
                type="text"
                value={m.form.patientName}
                onChange={(e) => m.set('patientName', e.target.value)}
                placeholder="Facultatif"
                className={FIELD}
              />
            </FieldWrap>
          )}

          {/* Notes */}
          <FieldWrap label="Notes (facultatif)">
            <textarea
              value={m.form.notes}
              onChange={(e) => m.set('notes', e.target.value)}
              placeholder="Informations complémentaires…"
              rows={2}
              className={TEXTAREA}
            />
          </FieldWrap>

          {m.error && (
            <p className="text-[13px] text-danger bg-danger-soft rounded-xl px-4 py-2.5">{m.error}</p>
          )}

          <button
            type="button"
            onClick={m.submit}
            disabled={m.submitting}
            className="w-full h-14 rounded-xl bg-ink text-paper text-[16px] font-bold flex items-center justify-center gap-2 disabled:opacity-60 transition-opacity active:scale-[0.98]"
          >
            {m.submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Ajouter la course
          </button>
        </div>
      </div>
    </div>
  )
}

function FieldWrap({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wider text-warm-500 mb-1.5">{label}</p>
      {children}
    </div>
  )
}
