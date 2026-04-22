'use client'
import { X, Check, Loader2 } from 'lucide-react'

interface Props {
  newName:    string
  setNewName: (v: string) => void
  newDesc:    string
  setNewDesc: (v: string) => void
  saving:     boolean
  onSubmit:   () => void
  onClose:    () => void
}

export function CreateGroupModal({
  newName, setNewName, newDesc, setNewDesc, saving, onSubmit, onClose,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-paper w-full max-w-lg rounded-t-3xl md:rounded-2xl p-6 shadow-float space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[18px] font-bold text-ink tracking-tight">Créer un groupe</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="w-8 h-8 rounded-full bg-warm-100 flex items-center justify-center text-ink hover:bg-warm-200 transition-colors"
          >
            <X className="w-4 h-4" strokeWidth={1.8} />
          </button>
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-warm-500 uppercase tracking-[0.14em] mb-1.5">
            Nom du groupe *
          </label>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Ex : Les collègues du lundi"
            className="w-full h-11 px-4 rounded-xl border border-warm-200 focus:border-ink focus:outline-none text-[13.5px] text-ink transition-colors"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-warm-500 uppercase tracking-[0.14em] mb-1.5">
            Description (optionnel)
          </label>
          <input
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Ex : Chauffeurs du secteur Ouest"
            className="w-full h-11 px-4 rounded-xl border border-warm-200 focus:border-ink focus:outline-none text-[13.5px] text-ink transition-colors"
          />
        </div>
        <button
          type="button"
          onClick={onSubmit}
          disabled={saving || !newName.trim()}
          className="w-full h-11 rounded-xl bg-ink text-paper font-semibold text-[13.5px] flex items-center justify-center gap-2 hover:bg-warm-800 transition-colors disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
              Création…
            </>
          ) : (
            <>
              <Check className="w-4 h-4" strokeWidth={2} />
              Créer le groupe
            </>
          )}
        </button>
      </div>
    </div>
  )
}
