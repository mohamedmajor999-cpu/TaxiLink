'use client'
import { ArrowRight, Phone, AlertCircle } from 'lucide-react'
import type { Mission } from '@/lib/supabase/types'
import { getMinutesUntil, formatTime } from '@/lib/dateUtils'
import { formatDuration } from '@/lib/formatDuration'
import { computeDisplayFare } from '@/lib/missionFare'
import type { MissionProgressStep } from '@/lib/missionProgress'
import { NavigationSheet } from '../NavigationSheet'
import { useNextCourseHero } from './useNextCourseHero'
import { StepBar } from './StepBar'
import { CourseActionsMenu } from './CourseActionsMenu'

interface Props {
  mission: Mission
  onEdit: (mission: Mission) => void
}

const STATUS_LABEL: Record<MissionProgressStep, string> = {
  available: 'Prochaine course',
  accepted:  'Prochaine course',
  enroute:   'En route vers le patient',
  onboard:   'Patient à bord',
  dropped:   'Patient déposé',
  done:      'Course terminée',
  no_show:   'Patient absent',
  cancelled: 'Annulée',
}

export function NextCourseHero({ mission, onEdit }: Props) {
  const h = useNextCourseHero({ mission })
  const minutesUntil = getMinutesUntil(mission.scheduled_at)
  const time = formatTime(mission.scheduled_at)
  const delay = minutesUntil <= 0 ? 'Maintenant' : `Dans ${formatDuration(minutesUntil)}`
  const fareInfo = computeDisplayFare(mission)
  const fare = fareInfo.value > 0 ? fareInfo.value.toFixed(0) : '—'
  const isCpam = mission.transport_type === 'CPAM'
  const patient = mission.patient_name?.trim() || 'le patient'

  // Le CTA porte UNE seule action — la prochaine étape logique. Les autres
  // (annuler, no-show, prévenir, modifier) sont dans le menu "...".
  const cta = pickCta(h.progress, patient)
  const ctaHandler = cta.action === 'goToPickup' ? h.goToPickup
    : cta.action === 'arrivedAtPatient' ? h.arrivedAtPatient
    : cta.action === 'markDropped' ? h.markDropped
    : h.completeMission

  const [from, to] = [shortPlace(mission.departure), shortPlace(mission.destination)]

  return (
    <article className="relative rounded-[14px] bg-paper border border-warm-100 p-[18px] mb-4">
      {/* Statut + chip type */}
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold tracking-[0.02em] text-warm-500">
          <span className="w-1.5 h-1.5 rounded-full bg-brand motion-safe:animate-pulse" />
          {STATUS_LABEL[h.progress]}
        </span>
        <span className={`text-[10px] font-bold uppercase tracking-[0.1em] px-1.5 py-0.5 rounded-full ${
          isCpam ? 'text-blue-800 bg-blue-100' : 'text-warm-700 bg-warm-100'
        }`}>
          {isCpam ? 'CPAM' : 'Privé'}
        </span>
      </div>

      {/* Countdown + prix */}
      <div className="mt-3.5 flex items-baseline justify-between gap-3">
        <span className="text-[18px] font-bold tracking-[-0.015em] tabular-nums truncate">
          {delay}
          <span className="font-normal text-warm-500"> · {time}</span>
        </span>
        <span className="text-[14px] font-semibold text-warm-700 tabular-nums shrink-0">
          {fare}<span className="text-warm-400">€</span>
        </span>
      </div>

      {/* Trajet inline */}
      <p className="mt-2.5 text-[13.5px] text-ink font-medium leading-snug">
        <span className="font-semibold">{from}</span>
        <span className="mx-1.5 text-warm-400">→</span>
        <span className="font-semibold">{to}</span>
        {(mission.distance_km != null || mission.duration_min != null) && (
          <span className="text-warm-500 font-normal text-[12px] ml-1">
            {' · '}
            {mission.distance_km != null && <>{mission.distance_km} km</>}
            {mission.distance_km != null && mission.duration_min != null && ' · '}
            {mission.duration_min != null && <>{mission.duration_min} min</>}
            {mission.return_trip && <> · A/R</>}
          </span>
        )}
      </p>

      {/* Stepper 4 segments */}
      <div className="mt-[18px] pt-3.5 border-t border-warm-100">
        <StepBar progress={h.progress} />
      </div>

      {/* Actions : CTA + tel + menu */}
      <div className="mt-[18px] flex items-center gap-1.5">
        <button
          type="button"
          onClick={ctaHandler}
          disabled={h.busy}
          className="flex-1 min-w-0 h-[38px] rounded-lg bg-ink text-paper text-[12.5px] font-semibold inline-flex items-center justify-center gap-1.5 hover:bg-[#1a1a1a] disabled:opacity-50 transition-colors px-3"
        >
          <span className="truncate">{cta.label}</span>
          <ArrowRight className="w-3 h-3 shrink-0" strokeWidth={2.4} />
        </button>
        {mission.phone && (
          <a
            href={`tel:${mission.phone}`}
            aria-label="Appeler le patient"
            className="w-[38px] h-[38px] rounded-lg border border-warm-200 inline-flex items-center justify-center text-warm-700 hover:bg-warm-50 hover:text-ink transition-colors shrink-0"
          >
            <Phone className="w-3.5 h-3.5" strokeWidth={1.8} />
          </a>
        )}
        <CourseActionsMenu mission={mission} onEdit={onEdit} />
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

type CtaAction = 'goToPickup' | 'arrivedAtPatient' | 'markDropped' | 'completeMission'

function pickCta(progress: MissionProgressStep, patient: string): { label: string; action: CtaAction } {
  if (progress === 'dropped') return { label: 'Course terminée', action: 'completeMission' }
  if (progress === 'onboard') return { label: 'Patient déposé', action: 'markDropped' }
  if (progress === 'enroute') return { label: "J'y suis arrivé — patient à bord", action: 'arrivedAtPatient' }
  return { label: `Je pars chercher ${patient}`, action: 'goToPickup' }
}

// Garde uniquement la 1re partie de l'adresse (ville/quartier) pour l'affichage
// inline ; l'adresse complète reste accessible via le menu Modifier.
function shortPlace(address: string): string {
  const first = address.split(',')[0]?.trim()
  return first || address
}
