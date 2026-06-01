// Init / DI
export {
  setSupabaseClient,
  getSupabaseClient,
  __resetSupabaseClient,
  type TaxilinkSupabaseClient,
} from './lib/client'

export {
  api,
  setApiBaseUrl,
  getApiBaseUrl,
  setApiImpl,
  resetApiImpl,
  type ApiClient,
  ApiRequestError,
  type ApiError,
} from './lib/api'

export {
  broadcastMissionAccepted,
  setBroadcastImpl,
  resetBroadcastImpl,
  type BroadcastMissionAccepted,
} from './lib/missionBroadcast'

export {
  reportError,
  setErrorReporter,
  resetErrorReporter,
  type ErrorReporter,
} from './lib/errorReporter'

// Services — auth / profile / driver
export { authService } from './authService'
export { profileService } from './profileService'
export { driverService } from './driverService'
export { driverStatsService } from './driverStatsService'
export { userPrefsService, type MissionDefaults } from './userPrefsService'
export { pushTokenService, type PushPlatform, type PushTokenUpsert } from './pushTokenService'
export { driverBlockService, type BlockedDriver } from './driverBlockService'
export { documentService } from './documentService'
export { groupService } from './groupService'
export {
  groupStatsService,
  type GroupActivitySummary,
  type GroupDailyActivity,
} from './groupStatsService'

// Services — missions
export { missionQueries } from './missionQueries'
export { missionMutations } from './missionMutations'
export { untakenMissionService } from './untakenMissionService'
export { missionProgressMutations } from './missionProgressMutations'
export { missionCorrectionService, type CorrectionPatch } from './missionCorrectionService'
export { missionManualService, type ManualMissionInput } from './missionManualService'
export { missionService } from './missionService'
export {
  missionOfferService,
  type OfferStatus,
  type PendingOffer,
  type AcceptResult,
  type RefuseResult,
} from './missionOfferService'

// Services — paiements / revenus
export { paymentService } from './paymentService'
export {
  earningsService,
  type EarningsDay,
  type DailyEarningsStats,
} from './earningsService'

// Services — voice (Whisper + GPT). Exports fonction (pas objet).
export { parseVoiceAudio, type ParsedMissionFields, type MissionFormType } from './voiceParseService'
export {
  parseVoiceAnswer,
  type VoiceAnswerRequest,
  type VoiceAnswerResult,
  type VoiceAnswerIntent,
  type GuidedInputKind,
  type ChoiceOption,
} from './voiceAnswerService'
export { transcribeAudioBlob, type TranscribeResult } from './transcribeService'

// Services — routing / address autocomplete (Google Places + OSRM)
// Exports fonctions (pas objets) — appeler `setGoogleMapsKey()` cote mobile au boot.
export {
  computeRoute,
  computeRouteGoogle,
  setGoogleMapsKey as setRoutingGoogleMapsKey,
  type RouteResult,
} from './routingService'
export {
  searchGoogle,
  primeGoogleAutocompleteCache,
  isGoogleMapsKeyConfigured,
  setGoogleMapsKey as setPlacesGoogleMapsKey,
  type AddressSuggestion,
} from './googlePlacesSearchService'
export {
  resolveGooglePlace,
  setGoogleMapsKey as setPlaceDetailsGoogleMapsKey,
  type PlaceDetails,
} from './googlePlaceDetailsService'
export {
  findKnownPlaceMarseille,
  KNOWN_PLACES_MARSEILLE,
  type KnownPlace,
} from './knownPlacesMarseille'

// Proxy serveur pour les appels Google : si branché (mobile → Edge Function
// `google-cache`), tous les appels Places/Routes passent par lui au lieu de
// fetch direct vers Google. Cache partagé entre tous les drivers.
export {
  setGoogleProxyClient,
  type GoogleProxyClient,
  type GoogleProxyKind,
} from './lib/googleProxy'
