// Re-export depuis @taxilink/services. Bridge lazy via Proxy : voir _bridge.ts.
import {
  missionCorrectionService as _missionCorrectionService,
  type CorrectionPatch,
} from '@taxilink/services'
import { bridgeService } from './_bridge'

export const missionCorrectionService = bridgeService(_missionCorrectionService)
export type { CorrectionPatch }
