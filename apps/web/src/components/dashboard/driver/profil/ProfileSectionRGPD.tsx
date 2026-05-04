'use client'

import { Download, Trash2, Loader2, ShieldAlert, X } from 'lucide-react'
import { ProfileSection } from './ProfileSection'
import { ProfileMenuRow } from './ProfileMenuRow'
import { useProfileSectionRGPD } from './useProfileSectionRGPD'

// Section "Mes donnees" du profil : telecharger ses donnees (RGPD art. 20)
// + supprimer son compte avec anonymisation (RGPD art. 17). La suppression
// passe par une modal de confirmation avec checkbox obligatoire.
export function ProfileSectionRGPD() {
  const r = useProfileSectionRGPD()

  return (
    <>
      <ProfileSection title="Mes données (RGPD)">
        <ProfileMenuRow
          icon={
            r.exporting
              ? <Loader2 className="w-full h-full animate-spin" strokeWidth={1.8} />
              : <Download className="w-full h-full" strokeWidth={1.8} />
          }
          label={r.exporting ? 'Préparation…' : 'Télécharger mes données'}
          description="Fichier JSON avec toutes vos données personnelles"
          onClick={r.exporting ? undefined : r.downloadExport}
        />
        {r.exportError && (
          <div className="bg-danger-soft text-danger text-[12px] px-3 py-2 rounded-xl">
            {r.exportError}
          </div>
        )}
        <ProfileMenuRow
          tone="danger"
          icon={<Trash2 className="w-full h-full" strokeWidth={1.8} />}
          label="Supprimer mon compte"
          description="Anonymisation immédiate, irréversible"
          onClick={r.openConfirm}
        />
      </ProfileSection>

      {r.confirmOpen && (
        <DeleteConfirmModal
          ack={r.confirmAck}
          onAck={r.setConfirmAck}
          deleting={r.deleting}
          error={r.deleteError}
          onCancel={r.closeConfirm}
          onConfirm={r.confirmDelete}
        />
      )}
    </>
  )
}

interface ModalProps {
  ack: boolean
  onAck: (v: boolean) => void
  deleting: boolean
  error: string | null
  onCancel: () => void
  onConfirm: () => void
}

function DeleteConfirmModal({ ack, onAck, deleting, error, onCancel, onConfirm }: ModalProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rgpd-delete-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/40 px-4 pb-4 sm:pb-0"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md bg-paper rounded-3xl shadow-float p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Fermer"
          onClick={onCancel}
          className="absolute top-3 right-3 w-8 h-8 inline-flex items-center justify-center rounded-full hover:bg-warm-100 text-warm-600"
          disabled={deleting}
        >
          <X className="w-5 h-5" strokeWidth={1.8} />
        </button>

        <div className="flex items-center gap-3 mb-3">
          <span className="w-10 h-10 rounded-2xl bg-danger-soft text-danger flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5" strokeWidth={1.8} />
          </span>
          <h2 id="rgpd-delete-title" className="text-[18px] font-bold text-ink leading-tight">
            Supprimer mon compte
          </h2>
        </div>

        <p className="text-[14px] text-warm-700 leading-relaxed">
          Action <strong>irréversible</strong>. Vos données personnelles seront immédiatement anonymisées
          (nom remplacé par « Compte supprimé », téléphone et notes effacés).
        </p>
        <p className="text-[13px] text-warm-600 mt-2 leading-relaxed">
          Vos courses passées sont conservées 10 ans pour les obligations comptables (factures),
          mais sans aucune donnée nominative.
        </p>

        <label className="flex items-start gap-3 mt-4 p-3 rounded-2xl border border-warm-200 bg-warm-50 cursor-pointer">
          <input
            type="checkbox"
            checked={ack}
            onChange={(e) => onAck(e.target.checked)}
            disabled={deleting}
            className="mt-0.5 w-5 h-5 accent-danger cursor-pointer"
          />
          <span className="text-[13.5px] text-ink leading-snug select-none">
            Je comprends que cette action est irréversible et que je serai déconnecté de tous mes appareils.
          </span>
        </label>

        {error && (
          <div className="mt-3 bg-danger-soft text-danger text-[12.5px] px-3 py-2 rounded-xl">
            {error}
          </div>
        )}

        <div className="flex gap-2 mt-5">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="flex-1 h-11 rounded-2xl bg-warm-100 text-ink font-semibold text-[14px] hover:bg-warm-200 transition-colors disabled:opacity-60"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!ack || deleting}
            className="flex-1 h-11 rounded-2xl bg-danger text-white font-semibold text-[14px] hover:bg-danger/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
          >
            {deleting && <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />}
            {deleting ? 'Suppression…' : 'Supprimer définitivement'}
          </button>
        </div>
      </div>
    </div>
  )
}
