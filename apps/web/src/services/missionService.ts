// Re-export depuis @taxilink/services. Bridge lazy via Proxy : voir _bridge.ts.
import { missionService as _missionService } from '@taxilink/services'
import { bridgeService } from './_bridge'

export const missionService = bridgeService(_missionService)
