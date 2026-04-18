// Règles de validation partagées client + serveur
import { PHONE_REGEX } from './authValidators'

export { isValidPhone, isValidEmail, isValidPassword } from './authValidators'

export interface ValidationError {
  field: string
  message: string
}

export type MissionVisibility = 'GROUP' | 'PUBLIC'

export type MedicalMotif = 'HDJ' | 'CONSULTATION'

export interface MissionInput {
  departure: string
  destination: string
  departure_lat?: number | null
  departure_lng?: number | null
  destination_lat?: number | null
  destination_lng?: number | null
  distance_km?: number | null
  duration_min?: number | null
  price_eur?: number | null
  patient_name?: string | null
  phone?: string | null
  notes?: string | null
  type: 'CPAM' | 'PRIVE' | 'TAXILINK'
  medical_motif?: MedicalMotif | null
  scheduled_at?: string | null
  visibility?: MissionVisibility
  group_id?: string | null
}

export function validateMission(data: MissionInput): ValidationError[] {
  const errors: ValidationError[] = []

  if (!data.departure?.trim()) {
    errors.push({ field: 'departure', message: "L'adresse de départ est requise" })
  } else if (data.departure.trim().length < 5) {
    errors.push({ field: 'departure', message: "L'adresse de départ est trop courte" })
  }

  if (!data.destination?.trim()) {
    errors.push({ field: 'destination', message: "L'adresse d'arrivée est requise" })
  } else if (data.destination.trim().length < 5) {
    errors.push({ field: 'destination', message: "L'adresse d'arrivée est trop courte" })
  }

  if (data.departure?.trim() && data.destination?.trim() &&
      data.departure.trim().toLowerCase() === data.destination.trim().toLowerCase()) {
    errors.push({ field: 'destination', message: "Le départ et l'arrivée ne peuvent pas être identiques" })
  }

  if (data.price_eur !== null && data.price_eur !== undefined) {
    if (data.price_eur < 0)   errors.push({ field: 'price_eur', message: 'Le prix ne peut pas être négatif' })
    if (data.price_eur > 500) errors.push({ field: 'price_eur', message: 'Le prix ne peut pas dépasser 500€' })
  }

  if (data.distance_km !== null && data.distance_km !== undefined) {
    if (data.distance_km <= 0)    errors.push({ field: 'distance_km', message: 'La distance doit être positive' })
    if (data.distance_km > 1000)  errors.push({ field: 'distance_km', message: 'La distance ne peut pas dépasser 1000 km' })
  }

  if (data.duration_min !== null && data.duration_min !== undefined) {
    if (data.duration_min <= 0)   errors.push({ field: 'duration_min', message: 'La durée doit être positive' })
    if (data.duration_min > 600)  errors.push({ field: 'duration_min', message: 'La durée ne peut pas dépasser 600 minutes' })
  }

  for (const [field, val] of [
    ['departure_lat', data.departure_lat], ['destination_lat', data.destination_lat],
  ] as const) {
    if (val !== null && val !== undefined && (val < -90 || val > 90)) {
      errors.push({ field, message: 'La latitude doit être comprise entre -90 et 90' })
    }
  }
  for (const [field, val] of [
    ['departure_lng', data.departure_lng], ['destination_lng', data.destination_lng],
  ] as const) {
    if (val !== null && val !== undefined && (val < -180 || val > 180)) {
      errors.push({ field, message: 'La longitude doit être comprise entre -180 et 180' })
    }
  }

  if (data.phone?.trim()) {
    const cleaned = data.phone.replace(/\s/g, '')
    if (!PHONE_REGEX.test(cleaned)) {
      errors.push({ field: 'phone', message: 'Format de téléphone invalide (ex: 0601020304 ou +33601020304)' })
    }
  }

  if (data.type === 'CPAM' && !data.patient_name?.trim()) {
    errors.push({ field: 'patient_name', message: 'Le nom du patient est requis pour une mission CPAM' })
  }

  if (data.medical_motif != null && data.medical_motif !== 'HDJ' && data.medical_motif !== 'CONSULTATION') {
    errors.push({ field: 'medical_motif', message: 'Le motif médical doit être HDJ ou CONSULTATION' })
  }
  if (data.type !== 'CPAM' && data.medical_motif) {
    errors.push({ field: 'medical_motif', message: 'Le motif médical ne s\u2019applique qu\u2019aux missions CPAM' })
  }

  if (data.notes && data.notes.length > 500) {
    errors.push({ field: 'notes', message: 'Les notes ne peuvent pas dépasser 500 caractères' })
  }

  if (data.scheduled_at) {
    const ts = Date.parse(data.scheduled_at)
    if (Number.isNaN(ts)) {
      errors.push({ field: 'scheduled_at', message: 'La date planifiée est invalide' })
    }
  }

  if (data.visibility !== undefined && data.visibility !== 'GROUP' && data.visibility !== 'PUBLIC') {
    errors.push({ field: 'visibility', message: 'La visibilité doit être GROUP ou PUBLIC' })
  }

  if (data.visibility === 'GROUP' && !data.group_id?.trim()) {
    errors.push({ field: 'group_id', message: 'Un groupe doit être sélectionné pour une course visible par groupe' })
  }

  return errors
}
