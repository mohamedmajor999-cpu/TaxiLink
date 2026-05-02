'use client'
import { Navigation2, Phone, AlertCircle, Pencil, Settings2, Star, Clock, Car, UserCheck, CheckCircle2 } from 'lucide-react'
import type { Mission } from '@/lib/supabase/types'
import { getMinutesUntil, formatTime } from '@/lib/dateUtils'
import { formatDuration } from '@/lib/formatDuration'
import { computeDisplayFare } from '@/lib/missionFare'
import { gpsAppLabel } from '@/lib/gpsNavigation'
import type { MissionProgressStep } from '@/lib/missionProgress'
import { NavigationSheet } from '../NavigationSheet'
import { useNextCourseHero } from './useNextCourseHero'
import { StepBar } from './StepBar'
import { RouteRow } from './RouteRow'

interface Props {
  mission: Mission
  onEdit: (mission: Mission) => void
}

const HEADER_BY_PROGRESS: Record<MissionProgressStep, { label: string; Icon: typeof Star }> = {
  available: { label: 'Prochaine course', Icon: Star },
  accepted: { label: 'Prochaine course', Icon: Star },
  enroute: { label: 'En route vers le patient', Icon: Car },
  onboard: { label: 'Patient à bord', Icon: UserCheck },
  dropped: { label: 'Patient déposé', Icon: CheckCircle2 },
  done: { label: 'Course terminée', Icon: CheckCircle2 },
  no_show: { label: 'Patient absent', Icon: CheckCircle2 },
  cancelled: { label: 'Annulée', Icon: CheckCircle2 },
}

export function NextCourseHero({ mission, onEdit }: Props) {
  const h = useNextCourseHero({ mission })
  const minutesUntil = getMinutesUntil(mission.scheduled_at)
  const time = formatTime(mission.scheduled_at)
  const delay = minutesUntil <= 0 ? 'Maintenant' : `Dans ${formatDuration(minutesUntil)}`
  const phoneHref = mission.phone ? `tel:${mission.phone}` : null
  const fareInfo = computeDisplayFare(mission)
  const fare = fareInfo.value > 0 ? `${fareInfo.value.toFixed(0)} €` : '—'
  const isCpam = mission.transport_type === 'CPAM'
  const patient = mission.patient_name?.trim() || 'le patient'

  const isStep2 = h.step === 'toDestination'
  const ctaLabel = isStep2 ? 'Démarrer vers la destination' : `Je pars chercher ${patient}`
  const ctaHandler = isStep2 ? h.goToDestination : h.goToPickup
  const showArrivedBtn = !isStep2 && mission.enroute_at && !mission.pickup_at
  const gpsLabel = h.pref === 'ask' ? 'Demander à chaque fois' : gpsAppLabel(h.pref)
  const { label: headerLabel, Icon: HeaderIcon } = HEADER_BY_PROGRESS[h.progress]
  const isStarHeader = h.progress === 'available' || h.progress === 'accepted'

  return (
    <article className="relative rounded-[18px] bg-paper border-[1.5px] border-ink p-[18px] mb-4 shadow-[0_4px_18px_-14px_rgba(0,0,0,0.22)]">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex items-center gap-1.5 text-[10.5px] font-extrabold uppercase tracking-[0.08em] text-warm-700">
            <HeaderIcon
              className={`w-3.5 h-3.5 text-amber-600 ${isStarHeader ? 'fill-current' : ''}`}
              strokeWidth={2.4}
            />
            <span className="truncate">{headerLabel}</span>
          </span>
          <span className={`px-1.5 py-0.5 rounded text-[9.5px] font-extrabold uppercase tracking-[0.04em] shrink-0 ${
            isCpam ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
          }`}>
            {isCpam ? 'CPAM' : 'Privé'}
          </span>
        </div>
        <span className="inline-flex items-center gap-1 text-[11.5px] text-warm-700 font-bold tabular-nums shrink-0">
          <Clock className="w-3 h-3" strokeWidth={2.2} />
          {time}
        </span>
      </div>

      <div className="mt-2.5 grid grid-cols-[1fr_auto] gap-3 items-end">
        <div className="min-w-0">
          <div className="text-[28px] font-black tracking-tight leading-none tabular-nums text-ink">
            {delay}
          </div>
          <p className="mt-1 text-[12px] text-warm-700 truncate">
            <b className="text-ink font-bold">{mission.patient_name?.trim() || 'Patient'}</b>
            {mission.distance_km != null && <> · <b className="text-ink font-bold">{mission.distance_km} km</b></>}
            {mission.duration_min != null && <> · <b className="text-ink font-bold">{mission.duration_min} min</b></>}
            {mission.return_trip && <> · A/R</>}
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[9.5px] font-extrabold uppercase tracking-[0.08em] text-warm-500">
            {fareInfo.isEstimated ? 'Prix estimé' : 'Prix'}
          </div>
          <div className="text-[26px] font-black leading-none tabular-nums text-ink mt-0.5">
            {fare}
          </div>
        </div>
      </div>

      <div className="mt-3.5 py-3.5 border-t border-b border-warm-100 grid gap-1.5">
        <RouteRow label="Départ" address={mission.departure} variant="origin" />
        <div aria-hidden className="ml-[5px] w-px h-3 border-l-2 border-dotted border-warm-300" />
        <RouteRow label="Arrivée" address={mission.destination} variant="destination" />
      </div>

      <div className="mt-3">
        <StepBar progress={h.progress} />
      </div>

      <div className="mt-3.5 flex gap-1.5">
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
            className="w-12 h-12 rounded-2xl border border-warm-200 bg-warm-50 inline-flex items-center justify-center text-ink hover:bg-warm-100 transition-colors shrink-0"
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
          className="mt-1.5 w-full h-10 rounded-xl bg-warm-50 border border-warm-200 text-ink text-[12.5px] font-bold disabled:opacity-50"
        >
          J&apos;y suis arrivé — patient à bord
        </button>
      )}

      <div className="mt-2.5 flex items-center justify-between text-[10.5px] text-warm-500">
        <span className="inline-flex items-center gap-1">
          <Settings2 className="w-3 h-3" strokeWidth={2} />
          Ouvre dans <b className="text-ink font-bold">{gpsLabel}</b>
        </span>
        <button
          type="button"
          onClick={() => onEdit(mission)}
          className="inline-flex items-center gap-1 text-ink font-bold hover:underline"
        >
          <Pencil className="w-3 h-3" strokeWidth={2} />
          Corriger
        </button>
      </div>

      {h.error && (
        <div className="mt-2 inline-flex items-center gap-1 text-[11.5px] text-danger">
          <AlertCircle className="w-3.5 h-3.5" />
          {h.error}
        </div>
      )}

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
