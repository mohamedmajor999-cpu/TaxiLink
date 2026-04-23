'use client'
import { MapPin, Check, Loader2 } from 'lucide-react'
import { ALL_DEPARTEMENTS } from '@/lib/departement'
import { useDeptPreferencesCard } from './useDeptPreferencesCard'

export function DeptPreferencesCard() {
  const h = useDeptPreferencesCard()

  return (
    <section className="mb-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-warm-500 px-1 mb-2">
        Zones d’activité
      </p>

      <div className="bg-paper border border-warm-200 rounded-2xl p-4 flex flex-col gap-3">
        <p className="text-[12px] text-warm-600 flex items-start gap-2">
          <MapPin className="w-4 h-4 text-warm-500 shrink-0 mt-0.5" strokeWidth={1.8} />
          <span>
            Sélectionne les départements où tu veux recevoir des missions.
            Aucune sélection ⇒ tu vois toutes les missions.
          </span>
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 max-h-64 overflow-y-auto pr-1">
          {ALL_DEPARTEMENTS.map((d) => {
            const checked = h.selected.has(d.code)
            return (
              <label
                key={d.code}
                className={[
                  'flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer text-[12px] transition-colors',
                  checked ? 'bg-brand-soft text-ink font-semibold' : 'hover:bg-warm-50 text-warm-800',
                ].join(' ')}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => h.toggle(d.code)}
                  disabled={h.loading || h.saving}
                  className="w-3.5 h-3.5 accent-ink"
                />
                <span className="font-mono text-[11px] text-warm-500">{d.code}</span>
                <span className="truncate">{d.name}</span>
              </label>
            )
          })}
        </div>

        {h.error && (
          <div className="bg-danger-soft text-danger text-[12px] px-3 py-2 rounded-xl">
            {h.error}
          </div>
        )}

        <button
          type="button"
          onClick={h.save}
          disabled={!h.dirty || h.saving || h.loading}
          className="h-10 rounded-xl bg-ink text-paper text-[13px] font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-ink/90 transition-colors"
        >
          {h.saving && <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />}
          {h.saved && !h.saving && <Check className="w-4 h-4" strokeWidth={2.5} />}
          {h.saved ? 'Enregistré' : `Enregistrer (${h.selected.size})`}
        </button>
      </div>
    </section>
  )
}
