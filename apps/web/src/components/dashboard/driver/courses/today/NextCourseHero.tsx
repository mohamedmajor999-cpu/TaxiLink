'use client'
import { Navigation2, Phone, AlertCircle, Pencil, Settings2, Star, Clock } from 'lucide-react'
import type { Mission } from '@/lib/supabase/types'
import { getMinutesUntil, formatTime } from '@/lib/dateUtils'
import { formatDuration } from '@/lib/formatDuration'
import { formatMissionPrice } from '@/lib/formatMissionPrice'
import { gpsAppLabel } from '@/lib/gpsNavigation'
import { NavigationSheet } from '../NavigationSheet'
import { useNextCourseHero } from './useNextCourseHero'
import { StepBar } from './StepBar'
import { RouteRow } from './RouteRow'

interface Props {
  mission: Mission
  onEdit: (mission: Mission) => void
}

export function NextCourseHero({ mission, onEdit }: Props) {
  const h = useNextCourseHero({ mission })
  const minutesUntil = getMinutesUntil(mission.scheduled_at)
  const time = formatTime(mission.scheduled_at)
  const delay = minutesUntil <= 0 ? 'Maintenant' : `Dans ${formatDuration(minutesUntil)}`
  const phoneHref = mission.phone ? `tel:${mission.phone}` : null
  const fare = formatMissionPrice(mission)
  const isCpam = mission.transport_type === 'CPAM'
  const patient = mission.patient_name?.trim() || 'le patient'

  const isStep2 = h.step === 'toDestination'
  const ctaLabel = isStep2 ? 'Démarrer vers la destination' : `Je pars chercher ${patient}`
  const ctaHandler = isStep2 ? h.goToDestination : h.goToPickup
  const showArrivedBtn = !isStep2 && mission.enroute_at && !mission.pickup_at
  const gpsLabel = h.pref === 'ask' ? 'Demander à chaque fois' : gpsAppLabel(h.pref)

  return (
    <article className="relative overflow-hidden rounded-[22px] bg-ink text-paper p-4 mb-4">
      <div
        aria-hidden
        className="absolute -right-12 -top-10 w-36 h-36 rounded-full bg-brand/15 pointer-events-none"
      />
      <div className="relative">

        <div className="flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1.5 text-brand text-[10.5px] font-extrabold uppercase tracking-[0.08em]">
            <Star className="w-3 h-3 fill-current" strokeWidth={2.4} />
            <span>Prochaine course</span>
            <span className={`px-1.5 py-0.5 rounded text-[9.5px] tracking-[0.04em] ${
              isCpam ? 'bg-blue-400/20 text-blue-300' : 'bg-purple-400/20 text-purple-300'
            }`}>
              {isCpam ? 'CPAM' : 'Privé'}
            </span>
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] text-paper/85 tabular-nums">
            <Clock className="w-3 h-3" strokeWidth={2.2} />
            {time}
          </span>
        </div>

        <div className="mt-1.5 text-[26px] font-black leading-none tracking-tight tabular-nums">
          {delay}
        </div>

        <p className="mt-1 text-[12.5px] text-paper/65">
          {mission.patient_name?.trim() || 'Patient'}
          {mission.distance_km != null && <> · <b className="text-paper">{mission.distance_km} km</b></>}
          {mission.duration_min != null && <> · <b className="text-paper">{mission.duration_min} min</b></>}
        </p>

        <div className="mt-2.5 bg-paper/[0.06] rounded-xl p-3 grid gap-1.5">
          <RouteRow label="Départ" address={mission.departure} variant="origin" />
          <div aria-hidden className="ml-[7px] w-px h-3 border-l-2 border-dotted border-paper/25" />
          <RouteRow label="Arrivée" address={mission.destination} variant="destination" />
        </div>

        <div className="mt-2.5 grid grid-cols-3 gap-2">
          <Stat k="Distance" v={mission.distance_km != null ? `${mission.distance_km} km` : '—'} />
          <Stat k="Durée" v={mission.duration_min != null ? `${mission.duration_min} min` : '—'} />
          <Stat k="Prix" v={fare} highlight />
        </div>

        <div className="mt-3 pt-3 border-t border-paper/10">
          <StepBar progress={h.progress} />
        </div>

        <div className="mt-3 flex gap-1.5">
          <button
            type="button"
            onClick={ctaHandler}
            disabled={h.busy}
            className="flex-1 h-12 rounded-2xl bg-brand text-ink text-[13.5px] font-black inline-flex items-center justify-center gap-1.5 hover:bg-brand/90 disabled:opacity-50 transition-colors px-3"
          >
            <Navigation2 className="w-4 h-4 shrink-0" strokeWidth={2.4} />
            <span className="truncate">{ctaLabel}</span>
          </button>
          {phoneHref && (
            <a
              href={phoneHref}
              aria-label="Appeler le patient"
              className="w-12 h-12 rounded-2xl border border-paper/15 bg-paper/10 inline-flex items-center justify-center text-paper hover:bg-paper/15 transition-colors shrink-0"
            >
              <Phone className="w-5 h-5" strokeWidth={2} />
            </a>
          )}
        </div>

        {showArrivedBtn && (
          <button
            type="button"
            onClick={h.arrivedAtPatient}
            disabled={h.busy}
            className="mt-1.5 w-full h-10 rounded-xl bg-paper/10 border border-paper/15 text-paper text-[12.5px] font-bold disabled:opacity-50"
          >
            J&apos;y suis arrivé — patient à bord
          </button>
        )}

        <div className="mt-2.5 flex items-center justify-between text-[10.5px] text-paper/55">
          <span className="inline-flex items-center gap-1">
            <Settings2 className="w-3 h-3" strokeWidth={2} />
            Ouvre dans <b className="text-paper/85 font-bold">{gpsLabel}</b>
          </span>
          <button
            type="button"
            onClick={() => onEdit(mission)}
            className="inline-flex items-center gap-1 text-brand font-bold hover:underline"
          >
            <Pencil className="w-3 h-3" strokeWidth={2} />
            Corriger
          </button>
        </div>

        {h.error && (
          <div className="mt-2 inline-flex items-center gap-1 text-[11.5px] text-danger-soft">
            <AlertCircle className="w-3.5 h-3.5" />
            {h.error}
          </div>
        )}
      </div>

      {h.askPicker && (
        <NavigationSheet
          pickup={{
            label: 'Aller chercher',
            sublabel: mission.patient_name || undefined,
            address: mission.departure,
            dotClass: 'bg-paper',
          }}
          destination={{
            label: 'Aller à destination',
            address: mission.destination,
            dotClass: 'bg-brand border-2 border-ink',
          }}
          onClose={h.closeAskPicker}
        />
      )}
    </article>
  )
}

function Stat({ k, v, highlight = false }: { k: string; v: string; highlight?: boolean }) {
  return (
    <div className="bg-paper/[0.07] rounded-lg px-2.5 py-2">
      <div className="text-[9px] font-extrabold uppercase tracking-[0.06em] text-paper/50">{k}</div>
      <div className={`text-[13.5px] font-extrabold mt-0.5 tabular-nums leading-none ${
        highlight ? 'text-brand' : 'text-paper'
      }`}>
        {v}
      </div>
    </div>
  )
}
