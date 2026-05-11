// Re-export depuis @taxilink/services. Bridge lazy via Proxy : voir _bridge.ts.
import { paymentService as _paymentService } from '@taxilink/services'
import { bridgeService } from './_bridge'

export const paymentService = bridgeService(_paymentService)
