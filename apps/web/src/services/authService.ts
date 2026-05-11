// Re-export depuis @taxilink/services. Bridge lazy via Proxy : voir _bridge.ts.
import { authService as _authService } from '@taxilink/services'
import { bridgeService } from './_bridge'

export const authService = bridgeService(_authService)
