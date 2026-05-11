// Re-export depuis @taxilink/services. Bridge lazy via Proxy : voir _bridge.ts.
import {
  driverBlockService as _driverBlockService,
  type BlockedDriver,
} from '@taxilink/services'
import { bridgeService } from './_bridge'

export const driverBlockService = bridgeService(_driverBlockService)
export type { BlockedDriver }
