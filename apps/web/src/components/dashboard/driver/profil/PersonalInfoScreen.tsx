'use client'
import { ArrowLeft, Loader2, Check } from 'lucide-react'
import { useSettingsCompte } from './useSettingsCompte'

interface Props {
  onBack: () => void
}

export function PersonalInfoScreen({ onBack }: Props) {
  const s = useSettingsCompte()

  return (
    <div className="max-w-2xl mx-auto">
      <header className="flex items-center gap-3 mb-5">
        <button
          type="button"
          onClick={onBack}
          aria-label="Retour"
          className="w-9 h-9 rounded-full grid place-items-center hover:bg-warm-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-ink" strokeWidth={2} />
        </button>
        <h1 className="text-[20px] font-bold text-ink leading-tight tracking-tight">
          Informations personnelles
        </h1>
      </header>

      <div className="bg-paper border border-warm-200 rounded-2xl p-4 flex flex-col gap-3">
        <Field id="first_name" label="Prénom" value={s.firstName} onChange={s.setFirstName}
               disabled={s.loading || s.saving} placeholder="Jean" />
        <Field id="last_name" label="Nom" value={s.lastName} onChange={s.setLastName}
               disabled={s.loading || s.saving} placeholder="Dupont" />
        <Field id="phone" label="Téléphone" value={s.phone} onChange={s.setPhone}
               disabled={s.loading || s.saving} placeholder="0601020304" type="tel" />
        <div>
          <label className="text-[11px] font-medium text-warm-500 px-1">Email</label>
          <div className="mt-1 h-10 px-3 flex items-center rounded-xl bg-warm-50 border border-warm-200 text-[13px] text-warm-700 truncate">
            {s.email || '—'}
          </div>
          <p className="text-[11px] text-warm-500 px-1 mt-1">
            L&apos;email est lié à ton compte et ne peut être modifié ici.
          </p>
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
    </div>
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
