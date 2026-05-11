// Re-export depuis @taxilink/services. Bridge lazy via Proxy : voir _bridge.ts.
import {
  earningsService as _earningsService,
  type EarningsDay,
  type DailyEarningsStats,
} from '@taxilink/services'
import { bridgeService } from './_bridge'

export const earningsService = bridgeService(_earningsService)
export type { EarningsDay, DailyEarningsStats }
