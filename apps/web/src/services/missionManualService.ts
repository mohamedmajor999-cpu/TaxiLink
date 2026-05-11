// Re-export depuis @taxilink/services. Bridge lazy via Proxy : voir _bridge.ts.
import {
  missionManualService as _missionManualService,
  type ManualMissionInput,
} from '@taxilink/services'
import { bridgeService } from './_bridge'

export const missionManualService = bridgeService(_missionManualService)
export type { ManualMissionInput }
