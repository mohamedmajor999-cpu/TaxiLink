'use client'

import { useDriverStore } from '@/store/driverStore'
import { useModalStore } from '@/store/modalStore'
import { Icon } from '@/components/ui/Icon'
import { ModalOverlay } from './ModalOverlay'
import { ProfilHero } from './ProfilHero'
import { ProfilStatsGrid } from './ProfilStatsGrid'

const menuItems = [
  { icon: 'edit',          label: 'Modifier le profil', modal: 'editProfil'     as const, desc: 'Nom, téléphone, email' },
  { icon: 'description',  label: 'Documents',           modal: 'documents'      as const, desc: 'Carte pro, assurance, CT' },
  { icon: 'payments',     label: 'Paiements',           modal: 'paiements'      as const, desc: 'RIB, virements' },
  { icon: 'notifications',label: 'Notifications',       modal: 'notifications'  as const, desc: 'Alertes et sons' },
  { icon: 'security',     label: 'Sécurité',            modal: 'securite'       as const, desc: 'Mot de passe, 2FA' },
]

export function ProfilScreen() {
  const { driver } = useDriverStore()
  const { openModal } = useModalStore()

  return (
    <div className="pb-28 hide-scrollbar">
      <ProfilHero />

      <div className="px-5 pt-4 space-y-3">
        <ProfilStatsGrid />

        {driver.vehicle && (
          <div className="bg-white rounded-2xl shadow-soft p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                <Icon name="directions_car" size={20} className="text-white" />
              </div>
              <div>
                <div className="text-sm font-bold text-secondary">{driver.vehicle}</div>
                <div className="text-xs text-muted">{driver.vehicleType ?? 'Berline'}</div>
              </div>
            </div>
            {driver.cpamEnabled && (
              <div className="flex items-center gap-1 bg-green-50 border border-green-200 rounded-xl px-2.5 py-1.5">
                <Icon name="medical_services" size={13} className="text-green-600" />
                <span className="text-[10px] font-bold text-green-700 uppercase">CPAM</span>
              </div>
            )}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
          {menuItems.map((item, i) => (
            <button
              key={item.modal}
              onClick={() => openModal(item.modal)}
              aria-label={item.label}
              className={`w-full flex items-center justify-between p-4 hover:bg-bgsoft transition-colors btn-ripple ${
                i < menuItems.length - 1 ? 'border-b border-line' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-bgsoft flex items-center justify-center">
                  <Icon name={item.icon} size={18} className="text-secondary" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-secondary">{item.label}</div>
                  <div className="text-xs text-muted">{item.desc}</div>
                </div>
              </div>
              <Icon name="chevron_right" size={18} className="text-muted" />
            </button>
          ))}
        </div>

        <a
          href="/install"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full h-12 rounded-2xl bg-white shadow-soft border border-line text-secondary font-semibold text-sm flex items-center justify-center gap-2 hover:bg-bgsoft transition-colors btn-ripple"
          aria-label="Partager l'application"
        >
          <Icon name="qr_code" size={17} className="text-secondary" />
          Partager / Installer l'app
        </a>

        <button
          onClick={() => openModal('deconnexion')}
          aria-label="Se déconnecter"
          className="w-full h-12 rounded-2xl bg-white shadow-soft border border-line text-red-500 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-red-50 transition-colors btn-ripple"
        >
          <Icon name="logout" size={17} className="text-red-500" />
          Déconnexion
        </button>
      </div>

      <ModalOverlay />
    </div>
  )
}
