// Re-export depuis @taxilink/services. Bridge lazy via Proxy : voir _bridge.ts.
import { missionProgressMutations as _missionProgressMutations } from '@taxilink/services'
import { bridgeService } from './_bridge'

export const missionProgressMutations = bridgeService(_missionProgressMutations)
