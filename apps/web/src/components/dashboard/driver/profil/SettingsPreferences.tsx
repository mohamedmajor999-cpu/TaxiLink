'use client'
import { Bell, MapPin, Shield } from 'lucide-react'
import { SettingItem } from '@/components/taxilink/SettingItem'
import { Switch } from '@/components/taxilink/Switch'
import { useSettingsToggles } from './useSettingsToggles'

export function SettingsPreferences() {
  const t = useSettingsToggles()

  return (
    <section className="mb-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-warm-500 px-1 mb-2">
        Préférences
      </p>
      <div className="flex flex-col gap-2">
        <SettingItem
          icon={<Bell className="w-full h-full" strokeWidth={1.8} />}
          label="Notifications"
          description="Courses médicales · Groupe Taxi13"
          right={
            <Switch
              label="Notifications"
              checked={t.notifications}
              onChange={t.setNotifications}
            />
          }
        />
        <SettingItem
          icon={<MapPin className="w-full h-full" strokeWidth={1.8} />}
          label="Zone d'activité"
          description="Marseille · 10 km autour"
        />
        <SettingItem
          icon={<Shield className="w-full h-full" strokeWidth={1.8} />}
          label="Confidentialité"
          description="RGPD · Données personnelles"
        />
      </div>
    </section>
  )
}
