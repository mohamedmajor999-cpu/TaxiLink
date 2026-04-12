'use client'

import { useRouter } from 'next/navigation'
import { useModalStore } from '@/store/modalStore'
import { authService } from '@/services/authService'
import { Icon } from '@/components/ui/Icon'

export function DeconnexionModal() {
  const { closeModal } = useModalStore()
  const router = useRouter()

  const handleSignOut = async () => {
    await authService.signOut()
    closeModal()
    router.push('/')
  }

  return (
    <div className="pb-8">
      <div className="px-5 pt-6 pb-2 text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <Icon name="logout" size={28} className="text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-secondary mb-2">Déconnexion</h2>
        <p className="text-sm text-muted">
          Êtes-vous sûr de vouloir vous déconnecter ?
          Vous ne recevrez plus de missions.
        </p>
      </div>
      <div className="px-5 pt-4 flex flex-col gap-2">
        <button
          onClick={closeModal}
          className="w-full h-12 rounded-2xl bg-primary font-bold text-secondary btn-ripple"
        >
          Annuler
        </button>
        <button
          onClick={handleSignOut}
          className="w-full h-12 rounded-2xl bg-white border border-red-200 font-bold text-red-500 btn-ripple"
        >
          Se déconnecter
        </button>
      </div>
    </div>
  )
}
