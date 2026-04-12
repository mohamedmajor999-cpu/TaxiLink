'use client'

import { motion } from 'framer-motion'
import { ModalHeader } from './ModalHeader'
import { useSecuriteModal } from './useSecuriteModal'

export function SecuriteModal() {
  const {
    currentPassword, setCurrentPassword,
    newPassword, setNewPassword,
    loading, error, success,
    changePassword,
  } = useSecuriteModal()

  const [twoFa, setTwoFa] = [false, (_: boolean) => {}] // TODO: connecter au backend

  return (
    <div className="pb-8">
      <ModalHeader title="Sécurité" />
      <div className="px-5 pt-5 space-y-4">
        <div>
          <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5">
            Mot de passe actuel
          </label>
          <input
            type="password"
            placeholder="••••••••"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full h-12 px-4 rounded-xl border-2 border-line focus:border-accent focus:outline-none text-sm font-semibold"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5">
            Nouveau mot de passe
          </label>
          <input
            type="password"
            placeholder="••••••••"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full h-12 px-4 rounded-xl border-2 border-line focus:border-accent focus:outline-none text-sm font-semibold"
          />
        </div>

        {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}
        {success && <p className="text-xs text-green-600 font-semibold">Mot de passe modifié avec succès.</p>}

        <button
          onClick={changePassword}
          disabled={loading}
          className="w-full h-12 rounded-2xl bg-primary font-bold text-secondary btn-ripple disabled:opacity-50"
        >
          {loading ? 'Modification...' : 'Changer le mot de passe'}
        </button>

        <div className="flex items-center justify-between pt-2 border-t border-line">
          <div>
            <div className="text-sm font-semibold text-secondary">Double authentification</div>
            <div className="text-xs text-muted">2FA par SMS</div>
          </div>
          <button
            onClick={() => setTwoFa(!twoFa)}
            aria-label="Activer/désactiver 2FA"
            className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${twoFa ? 'bg-primary' : 'bg-line'}`}
          >
            <motion.div
              className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-button"
              animate={{ left: twoFa ? '24px' : '2px' }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </button>
        </div>
      </div>
    </div>
  )
}
