'use client'

import { Icon } from '@/components/ui/Icon'

interface Props {
  onClose: () => void
}

export function PartagerMissionModal({ onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg rounded-t-3xl md:rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-black text-secondary">Partager une mission</h2>
          <button onClick={onClose} aria-label="Fermer"
            className="w-9 h-9 rounded-xl bg-bgsoft flex items-center justify-center hover:bg-line transition-colors">
            <Icon name="close" size={18} />
          </button>
        </div>
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Icon name="share" size={32} className="text-primary" />
          </div>
          <p className="font-bold text-secondary">Fonctionnalité en cours de développement</p>
          <p className="text-sm text-muted max-w-xs">
            Tu pourras bientôt créer une mission et la partager avec tes groupes ou tous les chauffeurs.
          </p>
        </div>
      </div>
    </div>
  )
}
