import { useEffect } from 'react'

import { driverService, reportError } from '@taxilink/services'

// TTL last_seen_at cote DB = 120s. On ping toutes les 60s pour rester sous la
// ligne morte. Equivalent mobile de apps/web/src/hooks/useDriverHeartbeat.ts.
const HEARTBEAT_INTERVAL_MS = 60_000

export function useDriverHeartbeat(driverId: string | null | undefined, isOnline: boolean) {
  useEffect(() => {
    if (!driverId || !isOnline) return

    const ping = () => {
      driverService.heartbeat(driverId).catch((err) => {
        reportError(err, { tags: { phase: 'heartbeat' } })
      })
    }
    // Ping immediat puis interval — sinon delai jusqu'au 1er heartbeat
    ping()
    const id = setInterval(ping, HEARTBEAT_INTERVAL_MS)
    return () => clearInterval(id)
  }, [driverId, isOnline])
}
