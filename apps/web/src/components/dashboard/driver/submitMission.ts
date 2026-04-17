import { missionService } from '@/services/missionService'
import { validateMission, type MissionInput, type MissionVisibility } from '@/lib/validators'
import type { Mission } from '@/lib/supabase/types'
import { buildScheduledAt, type MissionFormType } from './missionFormHelpers'

interface Coords { lat: number; lng: number }

export interface SubmitMissionArgs {
  mission?: Mission
  type: MissionFormType
  departure: string
  destination: string
  departureCoords: Coords | null
  destinationCoords: Coords | null
  distanceKm: number | null
  durationMin: number | null
  time: string
  price: string
  patientName: string
  phone: string
  notes: string
  visibility: MissionVisibility
  groupId: string | null
}

/**
 * Construit le payload `MissionInput`, valide, et appelle le bon endpoint.
 * Lève une Error avec un message lisible si la validation ou l'appel échoue.
 */
export async function submitMission(args: SubmitMissionArgs): Promise<void> {
  const scheduled_at = buildScheduledAt(args.time, args.mission?.scheduled_at)
  if (!scheduled_at) {
    throw new Error("L'heure doit être au format HH:MM (ex : 15h30 → 15:30)")
  }

  const priceNum = args.price.trim() ? Number(args.price.replace(',', '.')) : null
  if (args.price.trim() && (Number.isNaN(priceNum) || priceNum! < 0)) {
    throw new Error('Le prix doit être un nombre positif')
  }

  const payload: MissionInput = {
    type: args.type,
    departure: args.departure.trim(),
    destination: args.destination.trim(),
    departure_lat: args.departureCoords?.lat ?? null,
    departure_lng: args.departureCoords?.lng ?? null,
    destination_lat: args.destinationCoords?.lat ?? null,
    destination_lng: args.destinationCoords?.lng ?? null,
    distance_km: args.distanceKm,
    duration_min: args.durationMin,
    price_eur: priceNum,
    patient_name: args.type === 'CPAM' ? args.patientName.trim() : null,
    phone: args.phone.trim() || null,
    notes: args.notes.trim() || null,
    scheduled_at,
    visibility: args.visibility,
    group_id: args.visibility === 'GROUP' ? args.groupId : null,
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
