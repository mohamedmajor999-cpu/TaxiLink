'use client'
import { Bell, MapPin, Moon, Globe } from 'lucide-react'
import { SettingItem } from '@/components/taxilink/SettingItem'
import { Switch } from '@/components/taxilink/Switch'
import { useSettingsToggles } from './useSettingsToggles'

export function SettingsPreferences() {
  const t = useSettingsToggles()

  return (
    <section className="bg-paper border border-warm-200 rounded-2xl overflow-hidden">
      <div className="px-5 pt-4 pb-2 text-[11px] font-semibold uppercase tracking-wider text-warm-500">
        Préférences
      </div>
      <SettingItem
        icon={<Bell className="w-full h-full" strokeWidth={1.6} />}
        label="Notifications push"
        description="Nouvelles courses urgentes"
        right={<Switch label="Notifications push" checked={t.notifications} onChange={t.setNotifications} />}
      />
      <SettingItem
        icon={<MapPin className="w-full h-full" strokeWidth={1.6} />}
        label="Zone de travail"
        description="Marseille + 30 km"
      />
      <SettingItem
        icon={<Moon className="w-full h-full" strokeWidth={1.6} />}
        label="Mode sombre auto"
        description="Selon l'heure (21h → 7h)"
        right={<Switch label="Mode sombre auto" checked={t.autoDarkMode} onChange={t.setAutoDarkMode} />}
      />
      <SettingItem
        icon={<Globe className="w-full h-full" strokeWidth={1.6} />}
        label="Langue"
        description="Français"
      />
    </section>
  )
}
