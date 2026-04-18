'use client'
import type { MedicalMotif } from '@/lib/validators'
import type { MissionFormType } from './missionFormHelpers'
import { estimateMarseilleFare } from './marseilleFareEstimate'
import { estimateCpamFare } from './cpamFareEstimate'

interface Props {
  type: MissionFormType
  medicalMotif: MedicalMotif | null
  distanceKm: number | null
  date: string
  time: string
  departure: string
  destination: string
  onEstimate: (value: number) => void
}

export function FareEstimateButton({
  type, medicalMotif, distanceKm, date, time, departure, destination, onEstimate,
}: Props) {
  let est: number | null = null
  let label = ''
  if (type === 'CPAM' && medicalMotif) {
    est = estimateCpamFare({ distanceKm, date, time, medicalMotif, departure, destination })
    label = 'Estimer d\u2019après la convention CPAM'
  } else if (type === 'PRIVE') {
    est = estimateMarseilleFare({ distanceKm, date, time })
    label = 'Estimer d\u2019après le tarif Marseille'
  }

  if (est == null) return null
  const value = est

  return (
    <div className="mt-2 space-y-0.5">
      <button
        type="button"
        onClick={() => onEstimate(value)}
        className="text-[12px] text-warm-500 hover:text-ink underline underline-offset-2 decoration-warm-300 hover:decoration-ink transition-colors"
      >
        {label} : ~{value} €
      </button>
      <p className="text-[11px] text-warm-400">
        Laissé vide, ce tarif estimé sera utilisé dans l&apos;annonce.
      </p>
    </div>
  )
}
