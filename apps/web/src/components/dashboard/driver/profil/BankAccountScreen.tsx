'use client'
import { ArrowLeft, Loader2, Check, ShieldCheck, Landmark } from 'lucide-react'
import { useBankAccountScreen } from './useBankAccountScreen'

interface Props {
  onBack: () => void
}

export function BankAccountScreen({ onBack }: Props) {
  const s = useBankAccountScreen()

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
          Compte bancaire
        </h1>
      </header>

      {s.hasIban && (
        <div className="bg-paper border border-warm-200 rounded-2xl p-4 mb-3 flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 grid place-items-center shrink-0">
            <Landmark className="w-5 h-5" strokeWidth={1.8} />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-ink">IBAN enregistré</p>
            <p className="text-[12px] text-warm-500">Compte se terminant par •••{s.last4}</p>
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5" strokeWidth={2} />
            Actif
          </span>
        </div>
      )}

      <div className="bg-paper border border-warm-200 rounded-2xl p-4 flex flex-col gap-3">
        <div>
          <label htmlFor="iban" className="text-[11px] font-medium text-warm-500 px-1">
            IBAN (utilisé pour tes virements)
          </label>
          <input
            id="iban"
            type="text"
            value={s.iban}
            onChange={(e) => s.onChange(e.target.value)}
            disabled={s.loading || s.saving}
            placeholder="FR76 3000 6000 0112 3456 7890 189"
            autoComplete="off"
            spellCheck={false}
            className="mt-1 w-full h-11 px-3 rounded-xl bg-paper border border-warm-200 text-[13px] font-mono tracking-wider text-ink placeholder:text-warm-400 focus:outline-none focus:border-ink disabled:bg-warm-50"
          />
          <p className="text-[11px] text-warm-500 px-1 mt-1">
            La clé de contrôle est vérifiée localement (norme ISO 7064).
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

      <p className="text-[11px] text-warm-500 px-1 mt-3">
        Tes coordonnées bancaires sont chiffrées côté serveur. Elles ne sont visibles que par toi
        et l&apos;équipe TaxiLink en cas de support.
      </p>
    </div>
  )
}
