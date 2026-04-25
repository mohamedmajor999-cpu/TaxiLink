'use client'
import { Bell, Mic, HelpCircle, LogOut, Loader2 } from 'lucide-react'
import { ProfileSection } from './ProfileSection'
import { ProfileMenuRow } from './ProfileMenuRow'
import { GreenSwitch } from './GreenSwitch'
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
