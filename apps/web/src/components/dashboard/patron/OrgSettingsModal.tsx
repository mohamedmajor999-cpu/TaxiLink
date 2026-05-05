'use client'
import { useEffect, useState } from 'react'
import { useCurrentOrg } from '@/hooks/useCurrentOrg'
import { organizationService } from '@/services/organizationService'

interface Props {
  open: boolean
  onClose: () => void
}

export function OrgSettingsModal({ open, onClose }: Props) {
  const { orgId, organization } = useCurrentOrg()
  const [name, setName] = useState('')
  const [siret, setSiret] = useState('')
  const [autoDispatch, setAutoDispatch] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (open && organization) {
      setName(organization.name)
      setSiret(organization.siret ?? '')
      setAutoDispatch(organization.auto_dispatch_enabled)
      setError(null)
      setSaved(false)
    }
  }, [open, organization])

  if (!open) return null

  const handleSave = async () => {
    if (!orgId) return
    setSubmitting(true)
    setError(null)
    try {
      await organizationService.updateOrg(orgId, {
        name: name.trim(),
        siret: siret.trim() || null,
        auto_dispatch_enabled: autoDispatch,
      })
      setSaved(true)
      setTimeout(onClose, 1000)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[1000] flex items-center justify-center bg-ink/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="max-w-md w-full rounded-2xl bg-paper dark:bg-night-surface border border-warm-200 dark:border-night-border p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-extrabold text-ink dark:text-night-text">Paramètres de l&apos;organisation</h3>
        <p className="text-xs text-warm-600 dark:text-night-text-soft mt-1">Modifiez les infos de votre flotte</p>

        <label className="block mt-4">
          <span className="text-xs font-bold text-warm-700 dark:text-night-text-soft uppercase tracking-wide">Nom</span>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full h-11 px-3 rounded-xl border border-warm-200 dark:border-night-border bg-paper dark:bg-night-bg text-sm text-ink dark:text-night-text" />
        </label>

        <label className="block mt-3">
          <span className="text-xs font-bold text-warm-700 dark:text-night-text-soft uppercase tracking-wide">SIRET (optionnel)</span>
          <input type="text" value={siret} onChange={(e) => setSiret(e.target.value)} placeholder="14 chiffres" className="mt-1 w-full h-11 px-3 rounded-xl border border-warm-200 dark:border-night-border bg-paper dark:bg-night-bg text-sm text-ink dark:text-night-text" />
        </label>

        <div className="mt-5 pt-4 border-t border-warm-200 dark:border-night-border">
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={autoDispatch} onChange={(e) => setAutoDispatch(e.target.checked)} className="mt-0.5 w-5 h-5 accent-ink dark:accent-night-brand" />
            <span className="flex-1">
              <span className="block text-sm font-bold text-ink dark:text-night-text">Assignation automatique</span>
              <span className="block text-xs text-warm-600 dark:text-night-text-soft mt-0.5">
                Quand activé, l&apos;app assigne silencieusement chaque nouvelle course au meilleur chauffeur (libre + le plus proche + moins chargé). Une notification apparaît à chaque batch.
              </span>
            </span>
          </label>
        </div>

        {error && <p className="mt-3 text-sm text-danger">{error}</p>}
        {saved && <p className="mt-3 text-sm text-green-600 font-medium">✓ Enregistré</p>}

        <div className="mt-5 flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 h-10 rounded-xl border border-warm-200 dark:border-night-border text-sm font-medium text-warm-700 dark:text-night-text-soft">Annuler</button>
          <button type="button" disabled={submitting || !name.trim()} onClick={handleSave} className="flex-1 h-10 rounded-xl bg-ink dark:bg-night-brand text-paper dark:text-night-bg text-sm font-bold disabled:opacity-50">
            {submitting ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  )
}
