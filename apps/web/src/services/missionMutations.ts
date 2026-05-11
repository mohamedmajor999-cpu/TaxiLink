// Re-export depuis @taxilink/services. Bridge lazy via Proxy : voir _bridge.ts.
import { missionMutations as _missionMutations } from '@taxilink/services'
import { bridgeService } from './_bridge'

export const missionMutations = bridgeService(_missionMutations)
