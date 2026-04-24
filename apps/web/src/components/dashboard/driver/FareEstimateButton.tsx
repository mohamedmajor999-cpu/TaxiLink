'use client'
import type { MedicalMotif, TransportType } from '@/lib/validators'
import type { MissionFormType } from './missionFormHelpers'
import { estimateMarseilleFareRange } from './marseilleFareEstimate'
import { estimateCpamFare } from './cpamFareEstimate'

interface Props {
  type: MissionFormType
  medicalMotif: MedicalMotif | null
  distanceKm: number | null
  durationMin: number | null
  staticDurationMin?: number | null
  date: string
  time: string
  departure: string
  destination: string
  passengers?: number | null
  transportType?: TransportType | null
  returnTrip?: boolean
  /** CPAM ou Privé sans fourchette : pré-remplit un seul prix. */
  onEstimate: (value: number) => void
  /** Privé : pré-remplit min + max. */
  onEstimateRange?: (min: number, max: number) => void
}

export function FareEstimateButton({
  type, medicalMotif, distanceKm, durationMin, staticDurationMin, date, time, departure, destination,
  passengers, transportType, returnTrip,
  onEstimate, onEstimateRange,
}: Props) {
  if (type === 'CPAM' && medicalMotif) {
    const est = estimateCpamFare({
      distanceKm, durationMin, date, time, medicalMotif, departure, destination,
      passengers, transportType, returnTrip,
    })
    if (est == null) return null
    return (
      <Wrapper>
        <EstimateLink onClick={() => onEstimate(est)}>
          Estimer d&rsquo;après la convention CPAM : ~{est} €
        </EstimateLink>
      </Wrapper>
    )
  }

  if (type === 'PRIVE') {
    const r = estimateMarseilleFareRange({
      distanceKm, durationMin,
      staticDurationMin: staticDurationMin ?? null,
      date, time, departure, destination,
    })
    if (r == null) return null
    const handle = () => {
      if (onEstimateRange && r.min !== r.max) onEstimateRange(r.min, r.max)
      else onEstimate(r.min)
    }
    const label = r.min === r.max ? `~${r.min} €` : `entre ${r.min} € et ${r.max} €`
    return (
      <Wrapper>
        <EstimateLink onClick={handle}>
          Estimer d&rsquo;après le tarif Marseille : {label}
        </EstimateLink>
        {r.min !== r.max && (
          <p className="text-[11px] text-warm-400">
            Fourchette : <strong>min</strong> = retour en charge, <strong>max</strong> = retour à vide.
          </p>
        )}
      </Wrapper>
    )
  }

  return null
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return <div className="mt-2 space-y-0.5">{children}</div>
}

function EstimateLink({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-[12px] text-warm-500 hover:text-ink underline underline-offset-2 decoration-warm-300 hover:decoration-ink transition-colors"
    >
      {children}
    </button>
  )
}
