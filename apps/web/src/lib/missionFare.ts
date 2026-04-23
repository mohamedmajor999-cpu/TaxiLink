import type { Mission } from '@/lib/supabase/types'
import type { MedicalMotif } from '@/lib/validators'
import { estimateCpamFare } from '@/components/dashboard/driver/cpamFareEstimate'
import { estimateMarseilleFare } from '@/components/dashboard/driver/marseilleFareEstimate'

export interface DisplayFare {
  /** Valeur à afficher (0 si aucune estimation possible). */
  value: number
  /** Vrai si la valeur vient d'une estimation algorithmique (CPAM / Marseille) et non d'un prix saisi. */
  isEstimated: boolean
}

type MissionLike = Pick<
  Mission,
  'price_eur' | 'type' | 'medical_motif' | 'distance_km' | 'duration_min' | 'scheduled_at' | 'departure' | 'destination'
>

// Les tarifs CPAM et préfectoraux sont définis en heure de Paris. On force ce
// fuseau à l'extraction, sinon un device en UTC (VPN, extension privacy) voit
// un prix majoré différent (ex: 06h30 UTC lu comme nuit au lieu de 08h30 locale).
const PARIS_PARTS = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Paris',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

function parisDateTime(iso: string): { date: string; time: string } | null {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  const parts = PARIS_PARTS.formatToParts(d)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  const hour = get('hour') === '24' ? '00' : get('hour')
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    time: `${hour}:${get('minute')}`,
  }
}

function normalizeMotif(raw: string | null | undefined): MedicalMotif | null {
  if (raw === 'HDJ' || raw === 'CONSULTATION') return raw
  return null
}

function estimateFor(m: MissionLike): number | null {
  const parts = parisDateTime(m.scheduled_at)
  if (!parts) return null
  const { date, time } = parts

  if (m.type === 'CPAM') {
    const motif = normalizeMotif(m.medical_motif)
    if (!motif) return null
    return estimateCpamFare({
      distanceKm: m.distance_km,
      date,
      time,
      medicalMotif: motif,
      departure: m.departure,
      destination: m.destination,
    })
  }
  if (m.type === 'PRIVE') {
    return estimateMarseilleFare({
      distanceKm: m.distance_km,
      durationMin: m.duration_min,
      date,
      time,
    })
  }
  return null
}

/**
 * Prix à afficher pour une mission :
 * - si `price_eur` est renseigné (> 0) → prix manuel, `isEstimated = false`
 * - sinon → on tente l'estimation CPAM / Marseille ; si succès, `isEstimated = true`
 * - sinon → 0, `isEstimated = false` (on n'affiche pas le label "Prix estimé" sur un 0 non-estimé)
 */
export function computeDisplayFare(m: MissionLike): DisplayFare {
  const stored = m.price_eur != null ? Number(m.price_eur) : null
  if (stored != null && Number.isFinite(stored) && stored > 0) {
    return { value: stored, isEstimated: false }
  }
  const est = estimateFor(m)
  if (est != null && est > 0) {
    return { value: est, isEstimated: true }
  }
  return { value: 0, isEstimated: false }
}
