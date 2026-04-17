'use client'
import { Loader2, Check } from 'lucide-react'
import { useSettingsCompte } from './useSettingsCompte'

export function SettingsCompte() {
  const s = useSettingsCompte()

  return (
    <section className="mb-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-warm-500 px-1 mb-2">
        Compte
      </p>

      <div className="bg-paper border border-warm-200 rounded-2xl p-4 flex flex-col gap-3">
        <Field
          id="full_name"
          label="Nom complet"
          value={s.fullName}
          onChange={s.setFullName}
          disabled={s.loading || s.saving}
          placeholder="Prénom Nom"
        />
        <Field
          id="phone"
          label="Téléphone"
          value={s.phone}
          onChange={s.setPhone}
          disabled={s.loading || s.saving}
          placeholder="0601020304"
          type="tel"
        />
        <div>
          <label className="text-[11px] font-medium text-warm-500 px-1">Email</label>
          <div className="mt-1 h-10 px-3 flex items-center rounded-xl bg-warm-50 border border-warm-200 text-[13px] text-warm-700 truncate">
            {s.email || '—'}
          </div>
        </div>

        {s.error && (
          <div className="bg-danger-soft text-danger text-[12px] px-3 py-2 rounded-xl">
            {s.error}
          </div>
        )}

        <button
          type="button"
          onClick={s.save}
          disabled={!s.dirty || s.saving || s.loading}
          className="h-10 rounded-xl bg-ink text-paper text-[13px] font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-ink/90 transition-colors"
        >
          {s.saving && <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />}
          {s.saved && !s.saving && <Check className="w-4 h-4" strokeWidth={2.5} />}
          {s.saved ? 'Enregistré' : 'Enregistrer'}
        </button>
      </div>
    </section>
  )
}

function Field({
  id, label, value, onChange, disabled, placeholder, type = 'text',
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  disabled?: boolean
  placeholder?: string
  type?: string
}) {
  return (
    <div>
      <label htmlFor={id} className="text-[11px] font-medium text-warm-500 px-1">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className="mt-1 w-full h-10 px-3 rounded-xl bg-paper border border-warm-200 text-[13px] text-ink placeholder:text-warm-400 focus:outline-none focus:border-ink disabled:bg-warm-50 disabled:text-warm-500"
      />
    </div>
  )
}
