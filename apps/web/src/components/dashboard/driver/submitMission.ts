import { missionService } from '@/services/missionService'
import { validateMission, type MedicalMotif, type MissionInput, type MissionVisibility } from '@/lib/validators'
import type { Mission } from '@/lib/supabase/types'
import { buildScheduledAt, type MissionFormType } from './missionFormHelpers'

interface Coords { lat: number; lng: number }

export interface SubmitMissionArgs {
  mission?: Mission
  type: MissionFormType
  medicalMotif: MedicalMotif | null
  departure: string
  destination: string
  departureCoords: Coords | null
  destinationCoords: Coords | null
  distanceKm: number | null
  durationMin: number | null
  staticDurationMin: number | null
  date: string
  time: string
  price: string
  priceMin?: string
  priceMax?: string
  patientName: string
  phone: string
  notes: string
  visibility: MissionVisibility
  groupIds: string[]
  returnTrip?: boolean
  returnTime?: string | null
  transportType?: 'SEATED' | 'WHEELCHAIR' | 'STRETCHER' | null
  companion?: boolean
  passengers?: number | null
}

function parsePrice(s: string): number | null {
  const t = s.trim()
  if (!t) return null
  const n = Number(t.replace(',', '.'))
  return Number.isFinite(n) && n >= 0 ? n : null
}

/**
 * Construit le payload `MissionInput`, valide, et appelle le bon endpoint.
 * Lève une Error avec un message lisible si la validation ou l'appel échoue.
 */
export async function submitMission(args: SubmitMissionArgs): Promise<void> {
  const scheduled_at = buildScheduledAt(args.date, args.time)
  if (!scheduled_at) {
    throw new Error("Date ou heure invalide (format attendu : aaaa-mm-jj et HH:MM)")
  }

  const priceNum = parsePrice(args.price)
  if (args.price.trim() && priceNum == null) {
    throw new Error('Le prix doit être un nombre positif')
  }

  // Fourchette : uniquement privé, les deux bornes doivent être renseignées.
  const minNum = args.type === 'PRIVE' ? parsePrice(args.priceMin ?? '') : null
  const maxNum = args.type === 'PRIVE' ? parsePrice(args.priceMax ?? '') : null
  const hasRange = minNum != null && maxNum != null
  if (hasRange && minNum! > maxNum!) {
    throw new Error('Le prix maximum doit être supérieur ou égal au minimum')
  }
  if ((minNum != null) !== (maxNum != null)) {
    throw new Error('Renseigne un prix minimum et un prix maximum, ou laisse les deux vides')
  }

  // price_eur canonique : midpoint si fourchette, valeur unique sinon.
  const canonicalPrice = hasRange
    ? Math.round((minNum! + maxNum!) / 2)
    : priceNum

  const payload: MissionInput = {
    type: args.type,
    medical_motif: args.type === 'CPAM' ? args.medicalMotif : null,
    transport_type: args.type === 'CPAM' ? (args.transportType ?? null) : null,
    return_trip: args.type === 'CPAM' ? (args.returnTrip ?? false) : false,
    return_time: args.type === 'CPAM' && args.returnTrip ? (args.returnTime ?? null) : null,
    companion: args.companion ?? false,
    passengers: args.type !== 'CPAM' ? (args.passengers ?? null) : null,
    departure: args.departure.trim(),
    destination: args.destination.trim(),
    departure_lat: args.departureCoords?.lat ?? null,
    departure_lng: args.departureCoords?.lng ?? null,
    destination_lat: args.destinationCoords?.lat ?? null,
    destination_lng: args.destinationCoords?.lng ?? null,
    distance_km: args.distanceKm,
    duration_min: args.durationMin,
    static_duration_min: args.staticDurationMin,
    price_eur: canonicalPrice,
    price_min_eur: hasRange ? minNum : null,
    price_max_eur: hasRange ? maxNum : null,
    patient_name: args.type === 'CPAM' ? args.patientName.trim() : null,
    phone: args.phone.trim() || null,
    notes: args.notes.trim() || null,
    scheduled_at,
    visibility: args.visibility,
    group_ids: args.visibility === 'GROUP' ? args.groupIds : [],
  }

  const clientErrors = validateMission(payload)
  if (clientErrors.length > 0) {
    throw new Error(clientErrors[0].message)
  }

  if (args.mission) {
    await missionService.update(args.mission.id, payload)
  } else {
    await missionService.create(payload)
  }
}
