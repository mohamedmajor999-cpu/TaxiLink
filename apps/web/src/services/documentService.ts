// Re-export depuis @taxilink/services. Bridge lazy via Proxy : voir _bridge.ts.
import { documentService as _documentService } from '@taxilink/services'
import { bridgeService } from './_bridge'

export const documentService = bridgeService(_documentService)
