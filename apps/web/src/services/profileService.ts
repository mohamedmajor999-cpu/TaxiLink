// Re-export depuis @taxilink/services. Bridge lazy via Proxy : voir _bridge.ts.
import { profileService as _profileService } from '@taxilink/services'
import { bridgeService } from './_bridge'

export const profileService = bridgeService(_profileService)
