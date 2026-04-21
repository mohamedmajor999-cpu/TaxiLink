// Umbrella d'exports de validation (auth + missions).
// Les règles métier des missions sont dans ./missionValidators.

export { isValidPhone, isValidEmail, isValidPassword } from './authValidators'

export interface ValidationError {
  field: string
  message: string
}

export {
  validateMission,
  type MissionInput,
  type MissionVisibility,
  type MedicalMotif,
  type TransportType,
} from './missionValidators'
