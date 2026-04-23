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

// Fallback : quand on n'a pas staticDuration (mission stockée sans refetch
// Google), on prend 60% du différentiel (coûtHoraire - coûtKm) comme approx.
const SLOW_SUPPLEMENT_FACTOR = 0.60

interface Args {
  distanceKm: number | null
  date: string
  time: string
  durationMin?: number | null
  /** Durée sans trafic (Google routes.staticDuration). Si fourni, calcul exact. */
  staticDurationMin?: number | null
  /** Force le mode de retour. Sinon détection ZUPC via adresses (voir below). */
  returnEmpty?: boolean
  /** Adresses complètes — active la détection ZUPC automatique. */
  departure?: string | null
  destination?: string | null
}

function computeSlowSupplement(
  durationMin: number | null | undefined,
  staticDurationMin: number | null | undefined,
  kmCost: number,
): number {
  if (durationMin == null || durationMin <= 0) return 0
  // Vraie formule : temps perdu dans le trafic × tarif horaire.
  if (staticDurationMin != null && staticDurationMin >= 0) {
    const lost = Math.max(0, Math.min(60, durationMin - staticDurationMin))
    return (lost / 60) * TARIF_HORAIRE
  }
  // Fallback legacy (pas de staticDuration disponible).
  const hourlyCost = (durationMin / 60) * TARIF_HORAIRE
  const excess = hourlyCost - kmCost
  return excess > 0 ? excess * SLOW_SUPPLEMENT_FACTOR : 0
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
  return Math.max(MIN_COURSE, Math.round(raw))
}

function resolveReturnEmpty(
  explicit: boolean | undefined,
  departure: string | null | undefined,
  destination: string | null | undefined,
): boolean {
  if (typeof explicit === 'boolean') return explicit
  const mode = determineReturnMode(departure, destination)
  if (mode == null) return false // défaut legacy : aller-retour (min de la fourchette)
  return mode === 'vide'
}

/**
 * Tranche de prix pour une course privée.
 * - Si les adresses permettent de déterminer la ZUPC → prix exact (min = max).
 * - Sinon → fourchette : min = retour en charge (A/B), max = retour à vide (C/D).
 */
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
