'use client'
import { Download, Shield, HelpCircle, LogOut } from 'lucide-react'
import { SettingItem } from '@/components/taxilink/SettingItem'

interface Props {
  onInstall?: () => void
  onLogout: () => void
}

export function SettingsApp({ onInstall, onLogout }: Props) {
  return (
    <section className="bg-paper border border-warm-200 rounded-2xl overflow-hidden">
      <div className="px-5 pt-4 pb-2 text-[11px] font-semibold uppercase tracking-wider text-warm-500">
        Application
      </div>
      <SettingItem
        tone="accent-soft"
        icon={<Download className="w-full h-full text-warm-800" strokeWidth={1.6} />}
        label="Installer TaxiLink"
        description="Ajouter à l'écran d'accueil"
        right={
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onInstall?.() }}
            className="inline-flex items-center h-7 px-3 rounded-md bg-brand text-ink text-[11px] font-semibold hover:bg-brand/90 transition-colors"
          >
            Installer
          </button>
        }
      />
      <SettingItem
        icon={<Shield className="w-full h-full" strokeWidth={1.6} />}
        label="Mes données (RGPD)"
        description="Export ou suppression"
      />
      <SettingItem
        icon={<HelpCircle className="w-full h-full" strokeWidth={1.6} />}
        label="Aide & support"
        description="FAQ, contact"
      />
      <SettingItem
        tone="danger"
        icon={<LogOut className="w-full h-full" strokeWidth={1.6} />}
        label="Se déconnecter"
        onClick={onLogout}
      />
    </section>
  )
}
