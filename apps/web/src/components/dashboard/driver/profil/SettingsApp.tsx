'use client'
import { HelpCircle, UserPlus, LogOut } from 'lucide-react'
import { SettingItem } from '@/components/taxilink/SettingItem'

interface Props {
  onLogout: () => void
}

export function SettingsApp({ onLogout }: Props) {
  return (
    <section className="mb-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-warm-500 px-1 mb-2">
        Support
      </p>
      <div className="flex flex-col gap-2">
        <SettingItem
          icon={<HelpCircle className="w-full h-full" strokeWidth={1.8} />}
          label="Aide"
          description="FAQ · Contact"
        />
        <SettingItem
          icon={<UserPlus className="w-full h-full" strokeWidth={1.8} />}
          label="Inviter un chauffeur"
          description="Aidez votre réseau à grandir"
        />
        <SettingItem
          tone="danger"
          icon={<LogOut className="w-full h-full" strokeWidth={1.8} />}
          label="Se déconnecter"
          onClick={onLogout}
        />
      </div>
    </section>
  )
}
