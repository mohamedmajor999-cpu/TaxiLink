import type { MissionFormState } from '@/components/dashboard/driver/useMissionFormState'
import type { MissionFormType } from '@/components/dashboard/driver/missionFormHelpers'
import type { MedicalMotif } from '@/lib/validators'
import { smartAddressLookup } from '@/components/dashboard/driver/smartAddressLookup'

interface Coords { lat: number; lng: number }

interface ApplierArgs {
  form: MissionFormState
  setDepartureCoords: (c: Coords | null) => void
  setDestinationCoords: (c: Coords | null) => void
}

/**
 * Applique le `value` retourné par /api/missions/parse-voice-answer au bon
 * setter du form selon l'id de la question. Centralisé ici pour que le flow
 * vocal reste lisible et testable séparément.
 *
 * @returns true si la valeur a été appliquée, false si invalide/ignorée.
 */
export async function applyPosterAnswer(
  fieldId: string,
  value: unknown,
  a: ApplierArgs,
): Promise<boolean> {
  const f = a.form
  switch (fieldId) {
    case 'type':
      if (value === 'CPAM' || value === 'PRIVE') { f.setType(value as MissionFormType); return true }
      return false
    case 'medicalMotif':
      if (value === 'HDJ' || value === 'CONSULTATION') { f.setMedicalMotif(value as MedicalMotif); return true }
      return false
    case 'returnTrip':
      if (typeof value === 'boolean') { f.setReturnTrip(value); return true }
      return false
    case 'passengers': {
      const n = typeof value === 'number' ? value : Number(value)
      if (!Number.isFinite(n) || n < 1 || n > 8) return false
      f.setPassengers(Math.round(n))
      return true
    }
    case 'date':
      if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) { f.setDate(value); return true }
      return false
    case 'time':
      if (typeof value === 'string' && /^\d{2}:\d{2}$/.test(value)) { f.setTime(value); return true }
      return false
    case 'phone':
      if (typeof value === 'string' && value.trim().length > 0) { f.setPhone(value.trim()); return true }
      return false
    case 'departure':
    case 'destination': {
      if (typeof value !== 'string' || value.trim().length < 3) return false
      const match = await smartAddressLookup(value)
      if (fieldId === 'departure') {
        f.setDeparture(match?.label ?? value)
        if (match) a.setDepartureCoords({ lat: match.lat, lng: match.lng })
      } else {
        f.setDestination(match?.label ?? value)
        if (match) a.setDestinationCoords({ lat: match.lat, lng: match.lng })
      }
      return true
    }
    case 'groupIds':
      if (Array.isArray(value) && value.every((v) => typeof v === 'string')) {
        f.setVisibility('GROUP')
        f.setGroupIds(value as string[])
        return value.length > 0
      }
      return false
    default:
      return false
  }
}
