// Re-export depuis @taxilink/services. Bridge lazy via Proxy : voir _bridge.ts.
import { userPrefsService as _userPrefsService, type MissionDefaults } from '@taxilink/services'
import { bridgeService } from './_bridge'

export const userPrefsService = bridgeService(_userPrefsService)
export type { MissionDefaults }
