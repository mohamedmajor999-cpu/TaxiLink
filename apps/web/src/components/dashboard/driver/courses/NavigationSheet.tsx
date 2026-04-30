'use client'
import type { ComponentType, SVGProps } from 'react'
import { X } from 'lucide-react'
import { WazeIcon, GMapsIcon } from '@/components/ui/GpsAppIcon'
import { buildGpsUrl, gpsAppLabel, type GpsApp, type GpsPreference } from '@/lib/gpsNavigation'
import { useGpsPreference } from './useGpsPreference'

interface Leg {
  label: string
  sublabel?: string
  address: string
  dotClass: string
}

interface Props {
  pickup: Leg
  destination: Leg
  onClose: () => void
}

export function NavigationSheet({ pickup, destination, onClose }: Props) {
  const { pref } = useGpsPreference()
  const apps = appsForPref(pref)

  return (
    <div
      className="fixed inset-0 z-[60] bg-ink/40 flex items-end justify-center"
      onClick={onClose}
    >
      <div
        className="bg-paper w-full max-w-lg rounded-t-2xl shadow-soft"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <h3 className="text-[16px] font-bold text-ink">Démarrer la navigation</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="w-9 h-9 rounded-xl bg-warm-100 flex items-center justify-center text-ink hover:bg-warm-200 transition-colors"
          >
            <X className="w-4 h-4" strokeWidth={1.8} />
          </button>
        </div>

        <div className="px-5 pb-5 pt-2 space-y-3">
          <LegBlock leg={pickup} apps={apps} onLaunch={onClose} />
          <LegBlock leg={destination} apps={apps} onLaunch={onClose} />
        </div>
      </div>
    </div>
  )
}

function LegBlock({ leg, apps, onLaunch }: { leg: Leg; apps: readonly GpsApp[]; onLaunch: () => void }) {
  return (
    <div className="rounded-2xl border border-warm-200 bg-paper p-4">
      <div className="flex items-start gap-3 mb-3">
        <span className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${leg.dotClass}`} />
        <div className="min-w-0">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.06em] text-warm-500">{leg.label}</p>
          {leg.sublabel && <p className="text-[13px] text-warm-600 mt-0.5">{leg.sublabel}</p>}
          <p className="text-[14px] font-semibold text-ink mt-0.5 break-words">{leg.address}</p>
        </div>
      </div>
      <div className={`flex items-stretch gap-2 ${apps.length === 1 ? 'flex-col' : ''}`}>
        {apps.map((app) => (
          <GpsLinkBtn key={app} app={app} address={leg.address} onLaunch={onLaunch} />
        ))}
      </div>
    </div>
  )
}

function GpsLinkBtn({ app, address, onLaunch }: { app: GpsApp; address: string; onLaunch: () => void }) {
  const Icon: ComponentType<SVGProps<SVGSVGElement>> = app === 'waze' ? WazeIcon : GMapsIcon
  return (
    <a
      href={buildGpsUrl(app, address)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onLaunch}
      className="flex-1 flex items-center justify-center gap-2 h-12 rounded-2xl border border-warm-200 bg-paper text-ink text-[14px] font-semibold hover:shadow-md transition-all"
    >
      <Icon className="w-5 h-5" strokeWidth={2} />
      {gpsAppLabel(app)}
    </a>
  )
}

function appsForPref(pref: GpsPreference): readonly GpsApp[] {
  if (pref === 'waze') return ['waze']
  if (pref === 'maps') return ['maps']
  return ['maps', 'waze']
}
