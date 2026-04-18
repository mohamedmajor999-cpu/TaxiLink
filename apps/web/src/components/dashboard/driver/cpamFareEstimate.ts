import type { MedicalMotif } from '@/lib/validators'
import { isFrenchHoliday } from './frenchHolidays'

const FORFAIT = 13
const KM_INCLUS = 4
const TARIF_KM = 1.22
const BIG_CITY_SURCHARGE = 15
const MAJORATION = 1.5
const EMPTY_RETURN_SHORT = 0.25
const EMPTY_RETURN_LONG = 0.50
const EMPTY_RETURN_THRESHOLD_KM = 50

const BIG_CITIES = [
  'marseille', 'paris', 'lyon', 'nice', 'toulouse', 'strasbourg',
  'montpellier', 'rennes', 'bordeaux', 'lille', 'grenoble', 'nantes',
]

function isBigCityAddress(address: string | null | undefined): boolean {
  if (!address) return false
  const a = address.toLowerCase()
  if (BIG_CITIES.some((c) => a.includes(c))) return true
  return /\b(92|93|94)\d{3}\b/.test(a)
}

function isCpamMajoredPeriod(d: Date, hour: number): boolean {
  if (isFrenchHoliday(d)) return true
  const dow = d.getDay()
  if (dow === 0) return true
  if (dow === 6) return hour < 8 || hour >= 12
  if (dow === 1) return hour < 8 || hour >= 20
  return hour < 8 || hour >= 20
}

interface Args {
  distanceKm: number | null
  date: string
  time: string
  medicalMotif: MedicalMotif | null
  departure?: string | null
  destination?: string | null
}

export function estimateCpamFare({
  distanceKm, date, time, medicalMotif, departure, destination,
}: Args): number | null {
  if (distanceKm == null || distanceKm <= 0) return null
  if (!medicalMotif) return null

  const dm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date.trim())
  const tm = /^(\d{1,2}):(\d{2})$/.exec(time.trim())
  if (!dm || !tm) return null
  const d = new Date(Number(dm[1]), Number(dm[2]) - 1, Number(dm[3]))
  if (Number.isNaN(d.getTime())) return null
  const hour = Number(tm[1])

  const majored = isCpamMajoredPeriod(d, hour)
  const bigCity = isBigCityAddress(departure) || isBigCityAddress(destination)
  const kmBillable = Math.max(0, distanceKm - KM_INCLUS)

  const emptyReturnMult = medicalMotif === 'HDJ'
    ? (distanceKm >= EMPTY_RETURN_THRESHOLD_KM ? EMPTY_RETURN_LONG : EMPTY_RETURN_SHORT)
    : 0

  const kmPart = kmBillable * TARIF_KM * (1 + emptyReturnMult)
  let course = FORFAIT + kmPart
  if (bigCity) course += BIG_CITY_SURCHARGE
  if (majored) course = course * MAJORATION

  const total = course * 2

  return Math.round(total)
}
