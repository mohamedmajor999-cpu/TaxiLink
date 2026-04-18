import type { MedicalMotif } from '@/lib/validators'
import type { MissionFormType } from './missionFormHelpers'
import { estimateCpamFare } from './cpamFareEstimate'
import { estimateMarseilleFare } from './marseilleFareEstimate'

interface Args {
  price: string
  type: MissionFormType
  medicalMotif: MedicalMotif | null
  distanceKm: number | null
  date: string
  time: string
  departure: string
  destination: string
}

export function computeEffectivePrice(args: Args): number | null {
  const trimmed = args.price.trim()
  if (trimmed) {
    const n = Number(trimmed.replace(',', '.'))
    if (Number.isFinite(n) && n >= 0) return n
    return null
  }
  if (args.type === 'CPAM' && args.medicalMotif) {
    return estimateCpamFare({
      distanceKm: args.distanceKm,
      date: args.date,
      time: args.time,
      medicalMotif: args.medicalMotif,
      departure: args.departure,
      destination: args.destination,
    })
  }
  if (args.type === 'PRIVE') {
    return estimateMarseilleFare({
      distanceKm: args.distanceKm,
      date: args.date,
      time: args.time,
    })
  }
  return null
}
