import type { MedicalMotif, TransportType } from '../validators/missionValidators'
import { estimateCpamFare } from './cpamFareEstimate'
import { estimateMarseilleFare } from './marseilleFareEstimate'

export interface DisplayFare {
  value: number
  isEstimated: boolean
}

// MissionLike : champs minimaux pour calculer le tarif affiche. On ne depend
// PAS de @taxilink/supabase-types (qui appartient a un autre package).
// Chaque consommateur (web Mission, mobile Mission, RPC marketplace) implemente
// au moins cette forme.
export interface MissionLikeFare {
  price_eur: number | string | null
  type: string | null
  medical_motif: string | null
  distance_km: number | string | null
  duration_min: number | null
  static_duration_min: number | null
  scheduled_at: string
  departure: string | null
  destination: string | null
  passengers: number | null
  transport_type: string | null
  return_trip: boolean | null
}

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

function normalizeTransportType(raw: string | null | undefined): TransportType | null {
  if (raw === 'SEATED' || raw === 'WHEELCHAIR' || raw === 'STRETCHER') return raw
  return null
}

function toNumberOrNull(v: number | string | null | undefined): number | null {
  if (v == null) return null
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : null
}

function estimateFor(m: MissionLikeFare): number | null {
  const parts = parisDateTime(m.scheduled_at)
  if (!parts) return null
  const { date, time } = parts
  const distanceKm = toNumberOrNull(m.distance_km)

  if (m.type === 'CPAM') {
    const motif = normalizeMotif(m.medical_motif)
    if (!motif) return null
    return estimateCpamFare({
      distanceKm,
      durationMin: m.duration_min,
      date,
      time,
      medicalMotif: motif,
      departure: m.departure,
      destination: m.destination,
      passengers: m.passengers,
      transportType: normalizeTransportType(m.transport_type),
      returnTrip: m.return_trip ?? false,
    })
  }
  if (m.type === 'PRIVE') {
    return estimateMarseilleFare({
      distanceKm,
      durationMin: m.duration_min,
      staticDurationMin: m.static_duration_min,
      date,
      time,
      departure: m.departure,
      destination: m.destination,
      passengers: m.passengers,
    })
  }
  return null
}

export function computeDisplayFare(m: MissionLikeFare): DisplayFare {
  const stored = toNumberOrNull(m.price_eur)
  if (stored != null && stored > 0) {
    return { value: stored, isEstimated: false }
  }
  const est = estimateFor(m)
  if (est != null && est > 0) {
    return { value: est, isEstimated: true }
  }
  return { value: 0, isEstimated: false }
}
