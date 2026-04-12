'use client'

import { Icon } from '@/components/ui/Icon'
import { ModalHeader } from './ModalHeader'

const documents = [
  { icon: 'badge', label: 'Carte professionnelle', status: 'valid' as const, expiry: '31/12/2026' },
  { icon: 'policy', label: 'Assurance véhicule', status: 'valid' as const, expiry: '01/06/2025' },
  { icon: 'directions_car', label: 'Contrôle technique', status: 'valid' as const, expiry: '15/09/2025' },
  { icon: 'person_check', label: 'Permis de conduire', status: 'valid' as const, expiry: '22/03/2033' },
  { icon: 'article', label: 'Carte grise', status: 'invalid' as const, expiry: 'Expiré' },
]

export function DocumentsModal() {
  return (
    <div className="pb-8">
      <ModalHeader title="Documents" />
      <div className="px-5 pt-5 space-y-3">
        {documents.map((doc) => (
          <div key={doc.label} className="flex items-center justify-between p-4 bg-bgsoft rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white shadow-soft flex items-center justify-center">
                <Icon name={doc.icon} size={18} className="text-secondary" />
              </div>
              <div>
                <div className="text-sm font-semibold text-secondary">{doc.label}</div>
                <div className="text-xs text-muted">Exp. {doc.expiry}</div>
              </div>
            </div>
            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
              doc.status === 'valid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
            }`}>
              <Icon name={doc.status === 'valid' ? 'check_circle' : 'cancel'} size={12} />
              {doc.status === 'valid' ? 'Valide' : 'Invalide'}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
