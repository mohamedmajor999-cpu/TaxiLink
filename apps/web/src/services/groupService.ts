// Re-export depuis @taxilink/services. Bridge lazy via Proxy : voir _bridge.ts.
import { groupService as _groupService } from '@taxilink/services'
import { bridgeService } from './_bridge'

export const groupService = bridgeService(_groupService)
