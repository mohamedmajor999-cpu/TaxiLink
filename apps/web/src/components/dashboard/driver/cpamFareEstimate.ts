import type { MedicalMotif, TransportType } from '@/lib/validators'
import { isFrenchHoliday } from './frenchHolidays'
import { extractCommune, determineReturnMode } from './zupcBdr'

// Convention-cadre nationale CNAM taxi (arrêté 29 juillet 2025, en vigueur 01/11/2025)
const FORFAIT = 13
const KM_INCLUS = 4
// Tarif km BDR officiel — vérifié sur calcul-taxi-conventionne.fr (2026).
const TARIF_KM_BDR = 1.10
const BIG_CITY_SURCHARGE = 15
const MAJORATION = 1.5
const TPMR_SUPPLEMENT = 30
const EMPTY_RETURN_SHORT = 0.25
const EMPTY_RETURN_LONG = 0.50
const EMPTY_RETURN_THRESHOLD_KM = 50
// Abattement solo longue distance (≥ 30 km, 1 patient).
const SOLO_LONG_DISTANCE_KM = 30
const SOLO_LONG_DISTANCE_DISCOUNT = 0.05

const BIG_CITIES = [
  'marseille', 'paris', 'lyon', 'nice', 'toulouse', 'strasbourg',
  'montpellier', 'rennes', 'bordeaux', 'lille', 'grenoble', 'nantes',
]
const BIG_CITY_DEPTS = /\b(92|93|94)\d{3}\b/

const SHARED_DISCOUNTS: Record<number, number> = { 2: 0.23, 3: 0.35, 4: 0.37 }

function isInBigCity(address: string | null | undefined): boolean {
  if (!address) return false
  if (BIG_CITY_DEPTS.test(address)) return true
  const commune = extractCommune(address)
  if (!commune) return false
  return BIG_CITIES.includes(commune.toLowerCase())
}

/** True si >50% du trajet est entre 20h et 8h. Défaut : heure seule si durée inconnue. */
function isNightPeriod(d: Date, hour: number, minute: number, durationMin?: number | null): boolean {
  if (!durationMin || durationMin <= 0) return hour >= 20 || hour < 8
  const start = new Date(d)
  start.setHours(hour, minute, 0, 0)
  const end = new Date(start.getTime() + durationMin * 60_000)
  let nightMin = 0
  const cursor = new Date(start)
  while (cursor < end) {
    const h = cursor.getHours()
    const next = new Date(cursor)
    next.setHours(cursor.getHours() + 1, 0, 0, 0)
    const stop = next > end ? end : next
    if (h >= 20 || h < 8) nightMin += (stop.getTime() - cursor.getTime()) / 60_000
    cursor.setTime(stop.getTime())
  }
  return nightMin / durationMin > 0.5
}

function isMajoredPeriod(d: Date, hour: number, minute: number, durationMin?: number | null): boolean {
  if (isFrenchHoliday(d)) return true
  const dow = d.getDay()
  if (dow === 0) return true                         // dimanche
  if (dow === 6 && hour >= 12) return true           // samedi à partir de 12h
  return isNightPeriod(d, hour, minute, durationMin)
}

interface Args {
  distanceKm: number | null
  durationMin?: number | null
  date: string
  time: string
  medicalMotif: MedicalMotif | null
  departure?: string | null
  destination?: string | null
  passengers?: number | null
  transportType?: TransportType | null
  /** True = aller + retour patient (ex: HDJ, consultation AR). Défaut : 1 trajet. */
  returnTrip?: boolean
}

export function estimateCpamFare({
  distanceKm, durationMin, date, time, medicalMotif,
  departure, destination, passengers, transportType, returnTrip,
}: Args): number | null {
  if (distanceKm == null || distanceKm <= 0) return null
  if (!medicalMotif) return null
  const dm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date.trim())
  const tm = /^(\d{1,2}):(\d{2})$/.exec(time.trim())
  if (!dm || !tm) return null
  const d = new Date(Number(dm[1]), Number(dm[2]) - 1, Number(dm[3]))
  if (Number.isNaN(d.getTime())) return null
  const hour = Number(tm[1])
  const minute = Number(tm[2])

  // Grande ville : interdite si les 2 adresses sont dans la MÊME ZUPC BDR.
  const sameZupc = determineReturnMode(departure, destination) === 'charge'
  const bigCity = !sameZupc && (isInBigCity(departure) || isInBigCity(destination))

  // Km facturables (au-delà des 4 km inclus dans le forfait).
  const kmBillable = Math.max(0, distanceKm - KM_INCLUS)

  // Retour à vide HDJ : s'applique aussi en intra-ZUPC depuis convention CNAM 2025.
  const eligibleRetourVide = medicalMotif === 'HDJ'
  const emptyReturnMult = eligibleRetourVide
    ? (distanceKm >= EMPTY_RETURN_THRESHOLD_KM ? EMPTY_RETURN_LONG : EMPTY_RETURN_SHORT)
    : 0
  const kmPart = kmBillable * TARIF_KM_BDR * (1 + emptyReturnMult)

  // Socle (hors TPMR et péages qui ne sont pas soumis aux majorations/abattements).
  let socle = FORFAIT + kmPart
  if (bigCity) socle += BIG_CITY_SURCHARGE

  // Majoration nuit/WE/férié sur le socle complet.
  if (isMajoredPeriod(d, hour, minute, durationMin)) socle *= MAJORATION

  // Abattement : transport partagé (≥ 2 patients) OU solo longue distance (≥ 30 km).
  const nbPatients = Math.max(1, passengers ?? 1)
  let discount = 0
  if (nbPatients >= 2) {
    discount = nbPatients >= 4 ? SHARED_DISCOUNTS[4] : SHARED_DISCOUNTS[nbPatients] ?? 0
  } else if (distanceKm >= SOLO_LONG_DISTANCE_KM) {
    discount = SOLO_LONG_DISTANCE_DISCOUNT
  }
  const perPatient = socle * (1 - discount)

  // Total facturation patients (×2 si aller-retour patient).
  const passengerTotal = perPatient * nbPatients
  const passengerTotalAR = returnTrip ? passengerTotal * 2 : passengerTotal

  // Supplément TPMR (fauteuil roulant) — par véhicule, ×2 si AR (montée + descente).
  const tpmr = transportType === 'WHEELCHAIR' ? TPMR_SUPPLEMENT * (returnTrip ? 2 : 1) : 0

  return Math.round(passengerTotalAR + tpmr)
}
