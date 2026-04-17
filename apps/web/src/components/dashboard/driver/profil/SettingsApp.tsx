'use client'
import { HelpCircle, UserPlus, LogOut, Loader2 } from 'lucide-react'
import { SettingItem } from '@/components/taxilink/SettingItem'
import { useSettingsApp } from './useSettingsApp'

export function SettingsApp() {
  const s = useSettingsApp()

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
          icon={
            s.loggingOut
              ? <Loader2 className="w-full h-full animate-spin" strokeWidth={1.8} />
              : <LogOut className="w-full h-full" strokeWidth={1.8} />
          }
          label={s.loggingOut ? 'Déconnexion…' : 'Se déconnecter'}
          onClick={s.logout}
        />
        {s.error && (
          <div className="bg-danger-soft text-danger text-[12px] px-3 py-2 rounded-xl">
            {s.error}
          </div>
        )}
      </div>
    </section>
  )
}
