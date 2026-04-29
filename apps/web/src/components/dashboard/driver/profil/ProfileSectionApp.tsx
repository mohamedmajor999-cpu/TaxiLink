'use client'
import { Bell, Mic, HelpCircle, LogOut, Loader2, BellRing, MapPin } from 'lucide-react'
import { ProfileSection } from './ProfileSection'
import { ProfileMenuRow } from './ProfileMenuRow'
import { GreenSwitch } from './GreenSwitch'
import { ThemeModeRow } from './ThemeModeRow'
import { useProfileSectionApp } from './useProfileSectionApp'

interface Props {
  onOpenSupport?: () => void
}

export function ProfileSectionApp({ onOpenSupport }: Props) {
  const a = useProfileSectionApp()

  return (
    <ProfileSection title="Application">
      <ProfileMenuRow
        icon={<Bell className="w-full h-full" strokeWidth={1.8} />}
        label="Notifications"
        right={
          <GreenSwitch
            label="Notifications"
            checked={a.notifications}
            onChange={a.setNotifications}
          />
        }
      />
      <ProfileMenuRow
        icon={<Mic className="w-full h-full" strokeWidth={1.8} />}
        label="Voix (dictée vocale)"
        right={
          <GreenSwitch
            label="Dictée vocale"
            checked={a.voiceDictation}
            onChange={a.setVoiceDictation}
          />
        }
      />
      <ProfileMenuRow
        icon={<BellRing className="w-full h-full" strokeWidth={1.8} />}
        label="Alertes nouvelles courses"
        description="Popup quand une course proche est postée"
        right={
          <GreenSwitch
            label="Alertes nouvelles courses"
            checked={a.popupNewMission}
            onChange={(v) => { a.setPopupNewMission(v).catch(() => {}) }}
          />
        }
      />
      <ProfileMenuRow
        icon={<MapPin className="w-full h-full" strokeWidth={1.8} />}
        label="Partager ma position en ligne"
        description="Pour recevoir les courses proches de toi (RGPD)"
        right={
          <GreenSwitch
            label="Position GPS"
            checked={a.geolocPushEnabled}
            onChange={(v) => { a.setGeolocPushEnabled(v).catch(() => {}) }}
          />
        }
      />
      <ThemeModeRow pref={a.themePref} onChange={a.setThemePref} />
      <ProfileMenuRow
        icon={<HelpCircle className="w-full h-full" strokeWidth={1.8} />}
        label="Aide & support"
        onClick={onOpenSupport}
      />
      <ProfileMenuRow
        tone="danger"
        icon={
          a.loggingOut
            ? <Loader2 className="w-full h-full animate-spin" strokeWidth={1.8} />
            : <LogOut className="w-full h-full" strokeWidth={1.8} />
        }
        label={a.loggingOut ? 'Déconnexion…' : 'Se déconnecter'}
        onClick={a.logout}
      />
      {a.error && (
        <div className="bg-danger-soft text-danger text-[12px] px-3 py-2 rounded-xl">
          {a.error}
        </div>
      )}
    </ProfileSection>
  )
}
