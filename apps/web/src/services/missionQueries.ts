// Re-export depuis @taxilink/services. Bridge lazy via Proxy : voir _bridge.ts.
import { missionQueries as _missionQueries } from '@taxilink/services'
import { bridgeService } from './_bridge'

export const missionQueries = bridgeService(_missionQueries)
