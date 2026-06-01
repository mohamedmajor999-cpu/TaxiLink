// Stores Zustand cross-platform. Avant utilisation, l'app doit avoir appele
// `setSupabaseClient()`, `setApiImpl()`, `setBroadcastImpl()`, et optionnellement
// `setErrorReporter()` (cf. apps/web/src/services/_bridge.ts pour le pattern).
// Cote mobile, appeler aussi `setPersistStorage(asyncStorageAdapter)` au boot
// pour que les stores `persist` (postedAccept/postedUntaken) sauvegardent
// correctement (sinon ils tombent sur le memory store et perdent les dismissed
// au prochain lancement).

export { setPersistStorage, sharedStorage } from './_storage'

export { useGpsStore } from './gpsStore'
export { useNightModeStore, nightModeActive, type NightModePref } from './nightModeStore'
export { useUserPrefs } from './userPrefsStore'
export { useDriverStore } from './driverStore'
export { useMissionStore, useSortedMissions } from './missionStore'
export { useMissionEditStore } from './missionEditStore'
export { useMissionEditSheetStore, type EditMode } from './missionEditSheetStore'
export {
  usePostedAcceptStore,
  useUnseenAcceptCount,
  useIsMissionUnseen,
  type AcceptedMissionInfo,
} from './postedAcceptStore'
export {
  usePostedUntakenStore,
  useUnseenUntakenCount,
  useIsMissionUnseenUntaken,
} from './postedUntakenStore'
export {
  usePublishedFeedbackStore,
  type PublishedFeedback,
} from './publishedFeedbackStore'
export { useDriverAgendaStore } from './driverAgendaStore'
