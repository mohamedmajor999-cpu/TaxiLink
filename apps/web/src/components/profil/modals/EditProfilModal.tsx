'use client'

import { ModalHeader } from './ModalHeader'
import { useEditProfilModal } from './useEditProfilModal'

export function EditProfilModal() {
  const { form, setForm, isSaving, emailConfirmSent, closeModal, handleSave } = useEditProfilModal()

  if (emailConfirmSent) {
    return (
      <div className="pb-8">
        <ModalHeader title="Modifier le profil" />
        <div className="px-5 pt-5 space-y-4">
          <p className="text-sm text-center text-muted">
            Un email de confirmation a été envoyé à <strong>{form.email}</strong>.
            Clique sur le lien reçu pour valider le changement.
          </p>
          <button
            onClick={closeModal}
            className="w-full h-12 rounded-2xl bg-primary font-bold text-secondary btn-ripple"
          >
            OK
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="pb-8">
      <ModalHeader title="Modifier le profil" />
      <div className="px-5 pt-5 space-y-4">
        <div>
          <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5">
            Nom complet
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full h-12 px-4 rounded-xl border-2 border-line focus:border-accent focus:outline-none text-sm font-semibold"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5">
            Téléphone
          </label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full h-12 px-4 rounded-xl border-2 border-line focus:border-accent focus:outline-none text-sm font-semibold"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5">
            Email
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full h-12 px-4 rounded-xl border-2 border-line focus:border-accent focus:outline-none text-sm font-semibold"
          />
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full h-12 rounded-2xl bg-primary font-bold text-secondary btn-ripple disabled:opacity-50"
        >
          {isSaving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </div>
  )
}
