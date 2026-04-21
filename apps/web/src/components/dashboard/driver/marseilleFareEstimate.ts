import { isFrenchHoliday } from './frenchHolidays'

// Arrêté préfectoral Bouches-du-Rhône — tarifs taxi Marseille
const PRISE_EN_CHARGE = 2.35
const MIN_COURSE = 8.00
const TARIF_A = 1.11 // jour (7h-19h), retour en charge
const TARIF_B = 1.44 // nuit (19h-7h) / dim / fériés, retour en charge
const TARIF_C = 2.22 // jour, retour à vide
const TARIF_D = 2.88 // nuit / dim / fériés, retour à vide
const TARIF_HORAIRE = 34.60
// Pondération du supplément de marche lente (60% du théorique compteur)
const SLOW_SUPPLEMENT_FACTOR = 0.60

interface Args {
  distanceKm: number | null
  date: string
  time: string
  durationMin?: number | null
  returnEmpty?: boolean
}

export function estimateMarseilleFare({
  distanceKm,
  date,
  time,
  durationMin,
  returnEmpty,
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

  const tarifKm = returnEmpty
    ? (useNightTariff ? TARIF_D : TARIF_C)
    : (useNightTariff ? TARIF_B : TARIF_A)

  const kmCost = distanceKm * tarifKm

  // Marche lente : compteur bascule sur horaire quand vitesse < tarif_horaire / tarif_km.
  // Si durée prédite > distance/seuil, la portion excédentaire coûterait au tarif horaire.
  // On applique SLOW_SUPPLEMENT_FACTOR du différentiel pour rester sur la tranche basse.
  let slowSupplement = 0
  if (durationMin != null && durationMin > 0) {
    const hourlyCost = (durationMin / 60) * TARIF_HORAIRE
    const excess = hourlyCost - kmCost
    if (excess > 0) slowSupplement = excess * SLOW_SUPPLEMENT_FACTOR
  }

  const raw = PRISE_EN_CHARGE + kmCost + slowSupplement
  return Math.max(MIN_COURSE, Math.round(raw))
}

/**
 * Tranche de prix pour une course privée : min = retour en charge (A/B),
 * max = retour à vide (C/D). Retourne null si l'estimation n'est pas possible.
 */
export function estimateMarseilleFareRange(args: Omit<Args, 'returnEmpty'>):
  | { min: number; max: number }
  | null {
  const min = estimateMarseilleFare({ ...args, returnEmpty: false })
  const max = estimateMarseilleFare({ ...args, returnEmpty: true })
  if (min == null || max == null) return null
  return { min, max }
}
