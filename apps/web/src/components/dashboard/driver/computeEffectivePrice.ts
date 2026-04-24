import type { MedicalMotif } from '@/lib/validators'
import type { MissionFormType } from './missionFormHelpers'
import { estimateCpamFare } from './cpamFareEstimate'
import { estimateMarseilleFareRange } from './marseilleFareEstimate'

export type EffectivePrice =
  | { kind: 'fixed'; value: number }
  | { kind: 'range'; min: number; max: number }

interface Args {
  price: string
  priceMin: string
  priceMax: string
  type: MissionFormType
  medicalMotif: MedicalMotif | null
  distanceKm: number | null
  durationMin: number | null
  staticDurationMin?: number | null
  date: string
  time: string
  departure: string
  destination: string
}

const parseNum = (s: string): number | null => {
  const t = s.trim()
  if (!t) return null
  const n = Number(t.replace(',', '.'))
  return Number.isFinite(n) && n >= 0 ? n : null
}

export function computeEffectivePrice(args: Args): EffectivePrice | null {
  // Privé : si le chauffeur a saisi min/max → fourchette publiée
  if (args.type === 'PRIVE') {
    const min = parseNum(args.priceMin)
    const max = parseNum(args.priceMax)
    if (min != null && max != null) {
      return min === max ? { kind: 'fixed', value: min } : { kind: 'range', min, max }
    }
  }

  // Prix fixe saisi explicitement (CPAM ou privé sans fourchette)
  const fixed = parseNum(args.price)
  if (fixed != null) return { kind: 'fixed', value: fixed }

  // Estimation automatique
  if (args.type === 'CPAM' && args.medicalMotif) {
    const v = estimateCpamFare({
      distanceKm: args.distanceKm,
      date: args.date,
      time: args.time,
      medicalMotif: args.medicalMotif,
      departure: args.departure,
      destination: args.destination,
    })
    return v != null ? { kind: 'fixed', value: v } : null
  }

  if (args.type === 'PRIVE') {
    const r = estimateMarseilleFareRange({
      distanceKm: args.distanceKm,
      durationMin: args.durationMin,
      staticDurationMin: args.staticDurationMin ?? null,
      date: args.date,
      time: args.time,
      departure: args.departure,
      destination: args.destination,
    })
    if (r == null) return null
    return r.min === r.max ? { kind: 'fixed', value: r.min } : { kind: 'range', min: r.min, max: r.max }
  }

  return null
}
