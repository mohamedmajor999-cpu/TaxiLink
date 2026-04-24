// Validation métier des missions (client + serveur).
import { PHONE_REGEX } from './authValidators'
import type { ValidationError } from './validators'

export type MissionVisibility = 'GROUP' | 'PUBLIC'
export type MedicalMotif = 'HDJ' | 'CONSULTATION'
export type TransportType = 'SEATED' | 'WHEELCHAIR' | 'STRETCHER'

const HHMM_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/
const VALID_TRANSPORT: TransportType[] = ['SEATED', 'WHEELCHAIR', 'STRETCHER']

export interface MissionInput {
  departure: string
  destination: string
  departure_lat?: number | null
  departure_lng?: number | null
  destination_lat?: number | null
  destination_lng?: number | null
  distance_km?: number | null
  duration_min?: number | null
  static_duration_min?: number | null
  price_eur?: number | null
  price_min_eur?: number | null
  price_max_eur?: number | null
  patient_name?: string | null
  phone?: string | null
  notes?: string | null
  type: 'CPAM' | 'PRIVE' | 'TAXILINK'
  medical_motif?: MedicalMotif | null
  transport_type?: TransportType | null
  return_trip?: boolean
  return_time?: string | null
  companion?: boolean
  passengers?: number | null
  scheduled_at?: string | null
  visibility?: MissionVisibility
  group_ids?: string[]
}

const rangeKo = (v: number | null | undefined, lo: number, hi: number) => v != null && (v < lo || v > hi)

export function validateMission(d: MissionInput): ValidationError[] {
  const errors: ValidationError[] = []
  const push = (field: string, message: string) => errors.push({ field, message })

  // Adresses
  if (!d.departure?.trim()) push('departure', "L'adresse de départ est requise")
  else if (d.departure.trim().length < 5) push('departure', "L'adresse de départ est trop courte")
  if (!d.destination?.trim()) push('destination', "L'adresse d'arrivée est requise")
  else if (d.destination.trim().length < 5) push('destination', "L'adresse d'arrivée est trop courte")
  if (d.departure?.trim() && d.destination?.trim() &&
      d.departure.trim().toLowerCase() === d.destination.trim().toLowerCase()) {
    push('destination', "Le départ et l'arrivée ne peuvent pas être identiques")
  }

  // Prix / tranche / distance / durée
  if (rangeKo(d.price_eur, 0, 500)) push('price_eur', 'Le prix doit être compris entre 0 et 500€')
  const lo = d.price_min_eur, hi = d.price_max_eur
  if ((lo != null) !== (hi != null)) push('price_min_eur', 'La tranche de prix doit comporter un minimum et un maximum')
  else if (lo != null && hi != null) {
    if (lo < 0 || hi > 500) push('price_min_eur', 'Les bornes de la tranche doivent être entre 0 et 500€')
    if (lo > hi)            push('price_max_eur', 'Le prix maximum doit être supérieur ou égal au minimum')
    if (d.type === 'CPAM')  push('price_min_eur', 'La tranche de prix ne s\u2019applique qu\u2019aux courses privées')
  }
  if (d.distance_km != null && (d.distance_km <= 0 || d.distance_km > 1000)) push('distance_km', 'La distance doit être comprise entre 0 et 1000 km')
  for (const k of ['duration_min', 'static_duration_min'] as const) if (d[k] != null && (d[k]! <= 0 || d[k]! > 600)) push(k, 'La durée doit être comprise entre 0 et 600 minutes')

  // Coordonnées
  if (rangeKo(d.departure_lat, -90, 90))    push('departure_lat', 'La latitude doit être comprise entre -90 et 90')
  if (rangeKo(d.destination_lat, -90, 90))  push('destination_lat', 'La latitude doit être comprise entre -90 et 90')
  if (rangeKo(d.departure_lng, -180, 180))  push('departure_lng', 'La longitude doit être comprise entre -180 et 180')
  if (rangeKo(d.destination_lng, -180, 180)) push('destination_lng', 'La longitude doit être comprise entre -180 et 180')

  // Téléphone
  if (d.phone?.trim() && !PHONE_REGEX.test(d.phone.replace(/\s/g, ''))) {
    push('phone', 'Format de téléphone invalide (ex: 0601020304 ou +33601020304)')
  }

  // Règles CPAM
  if (d.type === 'CPAM' && !d.patient_name?.trim()) push('patient_name', 'Le nom du patient est requis pour une mission CPAM')
  if (d.medical_motif != null && d.medical_motif !== 'HDJ' && d.medical_motif !== 'CONSULTATION') push('medical_motif', 'Le motif médical doit être HDJ ou CONSULTATION')
  if (d.type !== 'CPAM' && d.medical_motif) push('medical_motif', 'Le motif médical ne s\u2019applique qu\u2019aux missions CPAM')
  if (d.transport_type && !VALID_TRANSPORT.includes(d.transport_type)) push('transport_type', 'Le type de transport doit être SEATED, WHEELCHAIR ou STRETCHER')
  if (d.type !== 'CPAM' && d.transport_type) push('transport_type', 'Le type de transport ne s\u2019applique qu\u2019aux missions CPAM')
  if (d.return_trip && d.type !== 'CPAM') push('return_trip', 'L\u2019aller-retour ne s\u2019applique qu\u2019aux missions CPAM')
  if (d.return_time != null && !HHMM_REGEX.test(d.return_time)) push('return_time', 'L\u2019heure de retour doit être au format HH:MM')
  if (d.return_time && !d.return_trip) push('return_time', 'L\u2019heure de retour suppose un aller-retour')

  // Passagers (privé)
  if (d.passengers != null && (d.passengers < 1 || d.passengers > 8)) push('passengers', 'Le nombre de passagers doit être compris entre 1 et 8')

  // Notes / date / visibilité
  if (d.notes && d.notes.length > 500) push('notes', 'Les notes ne peuvent pas dépasser 500 caractères')
  if (d.scheduled_at && Number.isNaN(Date.parse(d.scheduled_at))) push('scheduled_at', 'La date planifiée est invalide')
  if (d.visibility !== undefined && d.visibility !== 'GROUP' && d.visibility !== 'PUBLIC') push('visibility', 'La visibilité doit être GROUP ou PUBLIC')
  if (d.visibility === 'GROUP' && (!d.group_ids || d.group_ids.length === 0)) push('group_ids', 'Au moins un groupe doit être sélectionné pour une course visible par groupe')

  return errors
}
