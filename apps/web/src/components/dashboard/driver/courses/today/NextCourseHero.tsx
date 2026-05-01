'use client'
import { Navigation2, Phone, MapPin, AlertCircle, Pencil, Settings2 } from 'lucide-react'
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

  const isStep2 = h.step === 'toDestination'
  const ctaLabel = isStep2 ? 'Y aller — destination' : 'Y aller — chez le patient'
  const ctaHandler = isStep2 ? h.goToDestination : h.goToPickup

  const showArrivedBtn = !isStep2 && mission.enroute_at && !mission.pickup_at

  const gpsLabel = h.pref === 'ask' ? 'Demander à chaque fois' : gpsAppLabel(h.pref)

  return (
    <article className="relative overflow-hidden rounded-3xl bg-ink text-paper p-5 mb-5">
      <div
        aria-hidden="true"
        className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-brand/10 pointer-events-none"
      />
      <div className="relative">
        <div className="inline-flex items-center gap-1.5 bg-brand/15 text-brand px-2.5 py-1 rounded-full text-[10.5px] font-extrabold tracking-[0.06em] uppercase">
          <MapPin className="w-3.5 h-3.5" strokeWidth={2.4} />
          Prochaine
        </div>

        <div className="mt-3 text-[26px] font-extrabold leading-tight tracking-tight tabular-nums">
          {delay}
        </div>
        <p className="text-[13px] text-paper/65 mt-0.5">
          {time}{mission.patient_name ? ` · ${mission.patient_name}` : ''}
        </p>

        <div className="mt-4 space-y-1.5">
          <RouteRow variant="pickup" address={mission.departure} />
          <div className="ml-[3px] w-px h-3 border-l-2 border-dotted border-paper/25" />
          <RouteRow variant="destination" address={mission.destination} />
        </div>

        <div className="mt-4">
          <StepBar step={h.step} />
        </div>

        <div className="mt-4 flex items-center gap-4 pt-3 border-t border-paper/10 text-[12.5px] text-paper/85">
          {(mission.distance_km || mission.duration_min) && (
            <span>
              {mission.distance_km != null && <b className="text-paper">{mission.distance_km} km</b>}
              {mission.distance_km != null && mission.duration_min != null && ' · '}
              {mission.duration_min != null && <span>{mission.duration_min} min</span>}
            </span>
          )}
          <span>
            <b className="text-paper">{fare}</b> {isCpam ? 'CPAM' : 'Privé'}
          </span>
        </div>

        <div className="mt-3.5 flex gap-2">
          <button
            type="button"
            onClick={ctaHandler}
            disabled={h.busy}
            className="flex-1 h-12 rounded-2xl bg-brand text-ink text-[14px] font-extrabold inline-flex items-center justify-center gap-2 hover:bg-brand/90 disabled:opacity-50 transition-colors"
          >
            <Navigation2 className="w-4 h-4" strokeWidth={2.4} />
            {ctaLabel}
          </button>
          {phoneHref && (
            <a
              href={phoneHref}
              aria-label="Appeler le patient"
              className="w-12 h-12 rounded-2xl border border-paper/15 bg-paper/10 inline-flex items-center justify-center text-paper hover:bg-paper/15 transition-colors"
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
            className="mt-2 w-full h-10 rounded-xl bg-paper/10 border border-paper/15 text-paper text-[13px] font-bold disabled:opacity-50"
          >
            J'y suis arrivé — patient à bord
          </button>
        )}

        <div className="mt-3 flex items-center justify-between text-[11px] text-paper/55">
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
            dotClass: 'bg-ink',
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
