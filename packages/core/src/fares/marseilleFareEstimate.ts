import { isFrenchHoliday } from './frenchHolidays'
import { determineReturnMode } from './zupcBdr'

// Arrêté préfectoral Bouches-du-Rhône — tarifs taxi Marseille v2026
// (applicables depuis le 1er février 2026, cf. arrêté national 24/12/2025)
const PRISE_EN_CHARGE = 2.40
const MIN_COURSE = 8.00
const TARIF_A = 1.12 // jour (7h-19h), retour en charge
const TARIF_B = 1.45 // nuit (19h-7h) / dim / fériés, retour en charge
const TARIF_C = 2.24 // jour, retour à vide
const TARIF_D = 2.90 // nuit / dim / fériés, retour à vide
const TARIF_HORAIRE = 35.60
const SUPP_BAGAGE = 2.00
const SUPP_ENCOMBRANT = 2.00
const SUPP_5EME_PAX = 4.00

interface Args {
  distanceKm: number | null
  date: string
  time: string
  durationMin?: number | null
  staticDurationMin?: number | null
  returnEmpty?: boolean
  departure?: string | null
  destination?: string | null
  passengers?: number | null
  extraBagages?: number | null
  extraEncombrants?: number | null
}

function computeSupplements(
  passengers?: number | null,
  extraBagages?: number | null,
  extraEncombrants?: number | null,
): number {
  const pax = passengers != null && passengers > 4 ? (passengers - 4) * SUPP_5EME_PAX : 0
  const bag = extraBagages != null && extraBagages > 0 ? extraBagages * SUPP_BAGAGE : 0
  const enc = extraEncombrants != null && extraEncombrants > 0 ? extraEncombrants * SUPP_ENCOMBRANT : 0
  return pax + bag + enc
}

function computeSlowSupplement(
  durationMin: number | null | undefined,
  staticDurationMin: number | null | undefined,
  kmCost: number,
): number {
  if (durationMin == null || durationMin <= 0) return 0
  if (staticDurationMin != null && staticDurationMin >= 0) {
    const lost = Math.max(0, Math.min(60, durationMin - staticDurationMin))
    return (lost / 60) * TARIF_HORAIRE
  }
  const hourlyCost = (durationMin / 60) * TARIF_HORAIRE
  return Math.max(0, hourlyCost - kmCost)
}

export function estimateMarseilleFare({
  distanceKm,
  date,
  time,
  durationMin,
  staticDurationMin,
  returnEmpty,
  departure,
  destination,
  passengers,
  extraBagages,
  extraEncombrants,
}: Args): number | null {
  if (distanceKm == null || distanceKm <= 0) return null
  const dm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date.trim())
  const tm = /^(\d{1,2}):(\d{2})$/.exec(time.trim())
  if (!dm || !tm) return null
  const d = new Date(Number(dm[1]), Number(dm[2]) - 1, Number(dm[3]))
  if (Number.isNaN(d.getTime())) return null
  const hour = Number(tm[1])
  const isSunday = d.getDay() === 0
  const isNight = hour < 7 || hour >= 19
  const useNightTariff = isSunday || isNight || isFrenchHoliday(d)

  const resolvedReturnEmpty = resolveReturnEmpty(returnEmpty, departure, destination)
  const tarifKm = resolvedReturnEmpty
    ? (useNightTariff ? TARIF_D : TARIF_C)
    : (useNightTariff ? TARIF_B : TARIF_A)

  const kmCost = distanceKm * tarifKm
  const slowSupplement = computeSlowSupplement(durationMin, staticDurationMin, kmCost)

  const raw = PRISE_EN_CHARGE + kmCost + slowSupplement
  const baseTotal = Math.max(MIN_COURSE, Math.round(raw))
  return baseTotal + computeSupplements(passengers, extraBagages, extraEncombrants)
}

function resolveReturnEmpty(
  explicit: boolean | undefined,
  departure: string | null | undefined,
  destination: string | null | undefined,
): boolean {
  if (typeof explicit === 'boolean') return explicit
  const mode = determineReturnMode(departure, destination)
  if (mode == null) return false
  return mode === 'vide'
}

export function estimateMarseilleFareRange(args: Omit<Args, 'returnEmpty'>):
  | { min: number; max: number }
  | null {
  const zupcMode = determineReturnMode(args.departure, args.destination)
  if (zupcMode != null) {
    const exact = estimateMarseilleFare({ ...args, returnEmpty: zupcMode === 'vide' })
    if (exact == null) return null
    return { min: exact, max: exact }
  }
  const min = estimateMarseilleFare({ ...args, returnEmpty: false })
  const max = estimateMarseilleFare({ ...args, returnEmpty: true })
  if (min == null || max == null) return null
  return { min, max }
}

export const MARSEILLE_FARE_CONSTANTS = {
  SUPP_BAGAGE,
  SUPP_ENCOMBRANT,
  SUPP_5EME_PAX,
} as const
