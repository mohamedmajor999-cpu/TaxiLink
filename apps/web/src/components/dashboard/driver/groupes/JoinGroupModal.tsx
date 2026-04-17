'use client'
import { X, LogIn, Loader2 } from 'lucide-react'

interface Props {
  joinId:    string
  setJoinId: (v: string) => void
  saving:    boolean
  onSubmit:  () => void
  onClose:   () => void
}

export function JoinGroupModal({ joinId, setJoinId, saving, onSubmit, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-paper w-full max-w-lg rounded-t-3xl md:rounded-2xl p-6 shadow-float space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[18px] font-bold text-ink tracking-tight">Rejoindre un groupe</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="w-8 h-8 rounded-full bg-warm-100 flex items-center justify-center text-ink hover:bg-warm-200 transition-colors"
          >
            <X className="w-4 h-4" strokeWidth={1.8} />
          </button>
        </div>
        <p className="text-[13px] text-warm-600">
          Demandez l&apos;identifiant du groupe à son administrateur et collez-le ci-dessous.
        </p>
        <div>
          <label className="block text-[11px] font-semibold text-warm-500 uppercase tracking-[0.14em] mb-1.5">
            Identifiant du groupe
          </label>
          <input
            value={joinId}
            onChange={(e) => setJoinId(e.target.value)}
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            className="w-full h-11 px-4 rounded-xl border border-warm-200 focus:border-ink focus:outline-none text-[13px] font-mono text-ink transition-colors"
          />
        </div>
        <button
          type="button"
          onClick={onSubmit}
          disabled={saving || !joinId.trim()}
          className="w-full h-11 rounded-xl bg-brand text-ink font-semibold text-[13.5px] flex items-center justify-center gap-2 hover:bg-brand/90 transition-colors disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
              Rejoindre…
            </>
          ) : (
            <>
              <LogIn className="w-4 h-4" strokeWidth={2} />
              Rejoindre le groupe
            </>
          )}
        </button>
      </div>
    </div>
  )
}
