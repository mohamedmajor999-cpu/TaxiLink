'use client'

import { Icon } from '@/components/ui/Icon'
import { useConfirmWithPassword } from './useConfirmWithPassword'

interface Props {
  title:         string
  description:   string
  confirmLabel:  string
  danger?:       boolean
  onConfirmed:   () => Promise<void>
  onClose:       () => void
}

export function ConfirmWithPasswordModal({
  title, description, confirmLabel, danger = true, onConfirmed, onClose,
}: Props) {
  const { password, setPassword, error, loading, verify } = useConfirmWithPassword(onConfirmed, onClose)

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white w-full max-w-sm rounded-t-3xl md:rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-secondary">{title}</h3>
          <button onClick={onClose} aria-label="Fermer"
            className="w-8 h-8 rounded-xl bg-bgsoft flex items-center justify-center hover:bg-line transition-colors">
            <Icon name="close" size={16} />
          </button>
        </div>

        <p className="text-sm text-muted">{description}</p>

        <div>
          <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5">
            Mot de passe de connexion
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && verify()}
            placeholder="••••••••"
            autoFocus
            className="w-full h-11 px-4 rounded-xl border-2 border-line focus:border-accent focus:outline-none text-sm transition-colors"
          />
          {error && (
            <p className="flex items-center gap-1.5 text-xs text-red-500 mt-2 font-semibold">
              <Icon name="error" size={14} />
              {error}
            </p>
          )}
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            className="flex-1 h-11 rounded-xl border-2 border-line text-secondary font-semibold text-sm hover:bg-bgsoft transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={verify}
            disabled={loading || !password.trim()}
            className={`flex-1 h-11 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 ${
              danger
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-secondary text-white hover:bg-secondary/80'
            }`}
          >
            {loading
              ? <><Icon name="sync" size={16} className="animate-spin" />Vérification…</>
              : confirmLabel
            }
          </button>
        </div>
      </div>
    </div>
  )
}
