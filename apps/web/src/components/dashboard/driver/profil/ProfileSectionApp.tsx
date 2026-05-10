'use client'
import { HelpCircle, LogOut, Loader2, BellRing, MapPin, Navigation2 } from 'lucide-react'
import { WazeIcon, GMapsIcon } from '@/components/ui/GpsAppIcon'
import type { GpsPreference } from '@/lib/gpsNavigation'
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
      <GpsPrefRow value={a.gpsPref} onChange={a.setGpsPref} />
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

const GPS_OPTIONS: ReadonlyArray<{ value: GpsPreference; label: string; Icon?: typeof WazeIcon }> = [
  { value: 'ask', label: 'Les deux' },
  { value: 'maps', label: 'Maps', Icon: GMapsIcon },
  { value: 'waze', label: 'Waze', Icon: WazeIcon },
]

function GpsPrefRow({
  value, onChange,
}: { value: GpsPreference; onChange: (v: GpsPreference) => void }) {
  return (
    <div className="bg-paper border border-warm-200 rounded-2xl px-4 py-3">
      <div className="flex items-center gap-3 mb-2.5">
        <span className="w-9 h-9 rounded-xl bg-warm-100 text-warm-800 flex items-center justify-center shrink-0">
          <Navigation2 className="w-[18px] h-[18px]" strokeWidth={1.8} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-semibold leading-tight text-ink">Application GPS</div>
          <div className="text-[12px] text-warm-500 mt-0.5 truncate">
            Choix proposé au démarrage d&apos;une course
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1 bg-warm-100 rounded-xl p-1">
        {GPS_OPTIONS.map((opt) => {
          const active = value === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              aria-pressed={active}
              className={`h-9 rounded-lg text-[12.5px] font-bold transition-colors inline-flex items-center justify-center gap-1.5 ${
                active ? 'bg-paper text-ink shadow-sm' : 'bg-transparent text-warm-600 hover:text-ink'
              }`}
            >
              {opt.Icon && <opt.Icon className="w-4 h-4" />}
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
