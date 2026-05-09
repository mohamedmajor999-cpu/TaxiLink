'use client'

import { X, AlertCircle, Loader2 } from 'lucide-react'
import { useBlockDriverModal } from './useBlockDriverModal'

interface Props {
  blockerId:      string
  targetId:       string
  targetName:     string
  initialBlocked: boolean
  onClose:        () => void
  onChanged?:     (nowBlocked: boolean) => void
}

export function BlockDriverModal({ blockerId, targetId, targetName, initialBlocked, onClose, onChanged }: Props) {
  const { loading, error, submit } = useBlockDriverModal({
    blockerId, targetId, initialBlocked, onClose, onChanged,
  })

  const isUnblock = initialBlocked
  const title       = isUnblock ? `Débloquer ${targetName} ?`      : `Bloquer ${targetName} ?`
  const confirmCta  = isUnblock ? `Débloquer ${targetName}`        : `Bloquer ${targetName}`

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} />
      <div className="relative bg-paper w-full max-w-sm rounded-t-3xl md:rounded-2xl p-6 shadow-float space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[18px] font-bold text-ink tracking-tight">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="w-8 h-8 rounded-full bg-warm-100 flex items-center justify-center text-ink hover:bg-warm-200 transition-colors"
          >
            <X className="w-4 h-4" strokeWidth={1.8} />
          </button>
        </div>

        {isUnblock ? (
          <div className="text-[13px] text-warm-700 leading-relaxed space-y-2">
            <p>En débloquant {targetName} :</p>
            <ul className="list-disc list-inside space-y-1 pl-1">
              <li>{targetName} reverra à nouveau tes annonces</li>
              <li>Tu reverras à nouveau les siennes</li>
            </ul>
            <p className="pt-1">Tu peux le/la rebloquer à tout moment.</p>
          </div>
        ) : (
          <div className="text-[13px] text-warm-700 leading-relaxed space-y-2">
            <p>En bloquant {targetName} :</p>
            <ul className="list-disc list-inside space-y-1 pl-1">
              <li>{targetName} <strong>ne verra plus</strong> aucune de tes annonces</li>
              <li><strong>Tu ne verras plus</strong> aucune des siennes non plus</li>
            </ul>
            <p className="pt-1 text-[12px] text-warm-600">
              Le blocage est discret — la personne n&apos;est pas notifiée. Tu peux la débloquer
              à tout moment depuis ton profil.
            </p>
          </div>
        )}

        {error && (
          <p className="flex items-center gap-1.5 text-[12px] text-danger font-semibold">
            <AlertCircle className="w-3.5 h-3.5" strokeWidth={2.2} />
            {error}
          </p>
        )}

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-11 rounded-xl border border-warm-200 bg-paper text-ink font-semibold text-[13.5px] hover:bg-warm-50 transition-colors"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={loading}
            className={`flex-1 h-11 rounded-xl font-bold text-[13.5px] flex items-center justify-center gap-2 transition-colors disabled:opacity-50 ${
              isUnblock
                ? 'bg-ink text-paper hover:bg-ink/90'
                : 'bg-danger text-paper hover:bg-danger/90'
            }`}
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />Patientez…</>
              : confirmCta
            }
          </button>
        </div>
      </div>
    </div>
  )
}
