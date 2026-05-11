// Re-export depuis @taxilink/services. Bridge lazy via Proxy : voir _bridge.ts.
import { driverService as _driverService } from '@taxilink/services'
import { bridgeService } from './_bridge'

export const driverService = bridgeService(_driverService)
