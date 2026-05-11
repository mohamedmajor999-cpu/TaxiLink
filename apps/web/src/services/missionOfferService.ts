// Re-export depuis @taxilink/services. Bridge lazy via Proxy : voir _bridge.ts.
import {
  missionOfferService as _missionOfferService,
  type OfferStatus,
  type PendingOffer,
  type AcceptResult,
  type RefuseResult,
} from '@taxilink/services'
import { bridgeService } from './_bridge'

export const missionOfferService = bridgeService(_missionOfferService)
export type { OfferStatus, PendingOffer, AcceptResult, RefuseResult }
