import type { Mission } from '@/lib/supabase/types'
import type { AgendaRide } from '@taxilink/core'

const VALID_TYPES = new Set(['CPAM', 'PRIVE', 'TAXILINK'])

export function missionToAgendaRide(m: Mission): AgendaRide {
  return {
    id: m.id,
    type: VALID_TYPES.has(m.type) ? (m.type as AgendaRide['type']) : 'TAXILINK',
    patientName: m.patient_name ?? '',
    phone: m.phone ?? undefined,
    departure: m.departure,
    destination: m.destination,
    distanceKm: m.distance_km ?? 0,
    priceEur: m.price_eur ?? 0,
    priceMinEur: m.price_min_eur ?? undefined,
    priceMaxEur: m.price_max_eur ?? undefined,
    scheduledAt: m.scheduled_at,
    driverId: m.driver_id ?? '',
  }
}
