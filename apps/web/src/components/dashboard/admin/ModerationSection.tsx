'use client'

import { SectionShell } from './ui/SectionShell'
import { useModerationSection } from './useModerationSection'

// Section "Moderation" : permet a l'admin de supprimer un compte par email
// (anonymisation + DELETE auth.users). Double confirmation par re-saisie de
// l'email pour eviter les fausses manips.
export function ModerationSection() {
  const m = useModerationSection()

  return (
    <SectionShell
      title="Modération"
      subtitle="Supprimer un compte (RGPD art. 17 — droit à l'oubli)"
      iconName="gavel"
    >
      <div className="rounded-2xl border border-line bg-white p-4">
        <p className="mb-3 text-sm text-muted">
          La suppression anonymise instantanément le profil et la PII patient des missions
          partagées par cet utilisateur, puis supprime son compte auth. Les missions historiques
          sont conservées sans donnée nominative pour les obligations comptables (10 ans).
        </p>

        <label className="mb-3 block">
          <span className="mb-1 block text-xs font-medium text-secondary">Email du compte à supprimer</span>
          <input
            type="email"
            value={m.email}
            onChange={(e) => m.setEmail(e.target.value)}
            disabled={m.busy}
            placeholder="user@example.com"
            className="w-full rounded-xl border border-line px-3 py-2 text-sm focus:border-secondary focus:outline-none disabled:opacity-60"
          />
        </label>

        <label className="mb-3 block">
          <span className="mb-1 block text-xs font-medium text-secondary">
            Confirmer l&apos;email (doit être identique)
          </span>
          <input
            type="email"
            value={m.confirmEmail}
            onChange={(e) => m.setConfirmEmail(e.target.value)}
            disabled={m.busy}
            placeholder="user@example.com"
            className="w-full rounded-xl border border-line px-3 py-2 text-sm focus:border-secondary focus:outline-none disabled:opacity-60"
          />
        </label>

        <button
          type="button"
          onClick={m.deleteAccount}
          disabled={!m.isValid || m.busy}
          className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {m.busy ? 'Suppression…' : 'Anonymiser et supprimer'}
        </button>

        {m.result && (
          <div
            className={`mt-3 rounded-xl px-3 py-2 text-sm ${
              m.result.kind === 'ok'
                ? 'bg-emerald-50 text-emerald-800'
                : 'bg-rose-50 text-rose-700'
            }`}
          >
            {m.result.message}
          </div>
        )}
      </div>
    </SectionShell>
  )
}
