'use client'

import { Icon } from '@/components/ui/Icon'
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
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white w-full max-w-sm rounded-t-3xl md:rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-secondary">{title}</h3>
          <button onClick={onClose} aria-label="Fermer"
            className="w-8 h-8 rounded-xl bg-bgsoft flex items-center justify-center hover:bg-line transition-colors">
            <Icon name="close" size={16} />
          </button>
        </div>

        {isUnblock ? (
          <div className="text-sm text-muted leading-relaxed space-y-2">
            <p>En débloquant {targetName} :</p>
            <ul className="list-disc list-inside space-y-1 pl-1">
              <li>{targetName} reverra à nouveau vos annonces</li>
              <li>Vous reverrez à nouveau les siennes</li>
            </ul>
            <p className="pt-1">Vous pouvez le/la rebloquer à tout moment.</p>
          </div>
        ) : (
          <div className="text-sm text-muted leading-relaxed space-y-2">
            <p>En bloquant {targetName} :</p>
            <ul className="list-disc list-inside space-y-1 pl-1">
              <li>{targetName} <strong>ne verra plus</strong> aucune de vos annonces</li>
              <li><strong>Vous ne verrez plus</strong> aucune des siennes non plus</li>
            </ul>
            <p className="pt-1 text-xs">Le blocage est discret — la personne n&apos;est pas notifiée. Vous pouvez la débloquer à tout moment depuis votre profil.</p>
          </div>
        )}

        {error && (
          <p className="flex items-center gap-1.5 text-xs text-red-500 font-semibold">
            <Icon name="error" size={14} />{error}
          </p>
        )}

        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            className="flex-1 h-11 rounded-xl border-2 border-line text-secondary font-semibold text-sm hover:bg-bgsoft transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={submit}
            disabled={loading}
            className={`flex-1 h-11 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 ${
              isUnblock
                ? 'bg-secondary text-white hover:bg-secondary/80'
                : 'bg-red-500 text-white hover:bg-red-600'
            }`}
          >
            {loading
              ? <><Icon name="sync" size={16} className="animate-spin" />Patientez…</>
              : confirmCta
            }
          </button>
        </div>
      </div>
    </div>
  )
}
