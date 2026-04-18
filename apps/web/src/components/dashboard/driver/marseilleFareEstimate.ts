import { isFrenchHoliday } from './frenchHolidays'

const PRISE_EN_CHARGE = 2.40
const MIN_COURSE = 8.00
const TARIF_A = 1.12
const TARIF_B = 1.45

interface Args {
  distanceKm: number | null
  date: string
  time: string
}

export function estimateMarseilleFare({ distanceKm, date, time }: Args): number | null {
  if (distanceKm == null || distanceKm <= 0) return null
  const dm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date.trim())
  const tm = /^(\d{1,2}):(\d{2})$/.exec(time.trim())
  if (!dm || !tm) return null
  const d = new Date(Number(dm[1]), Number(dm[2]) - 1, Number(dm[3]))
  if (Number.isNaN(d.getTime())) return null
  const hour = Number(tm[1])
  const isSunday = d.getDay() === 0
  const isNight = hour < 7 || hour >= 19
  const useB = isSunday || isNight || isFrenchHoliday(d)
  const tarif = useB ? TARIF_B : TARIF_A
  const raw = PRISE_EN_CHARGE + distanceKm * tarif
  return Math.max(MIN_COURSE, Math.round(raw))
}
