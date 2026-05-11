// Re-export depuis @taxilink/core. Le code de verite vit dans
// packages/core/src/validators/missionValidators.ts (cross-platform).
export {
  validateMission,
  type ValidationError,
  type MissionInput,
  type MissionVisibility,
  type MedicalMotif,
  type TransportType,
} from '@taxilink/core'
