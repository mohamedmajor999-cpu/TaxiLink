'use client'
import { useEffect, useRef } from 'react'
import { useDriverStore } from '@/store/driverStore'
import { useUserPrefs } from '@/store/userPrefsStore'
import { driverService } from '@/services/driverService'

const PUSH_INTERVAL_MS = 30_000

interface Coords { lat: number; lng: number }

/**
 * Pousse la position GPS du chauffeur en base toutes les 30s tant qu'il est
 * en ligne ET que la geoloc precise est autorisee (pref `geolocPushEnabled`,
 * default true). Best-effort : on n'affiche pas l'erreur a l'utilisateur, le
 * popup nouvelle course tombera juste sur les autres chauffeurs si l'update
 * echoue (privacy-first : pas de spam Sentry pour ces erreurs benignes).
 */
export function useDriverPositionPush(userCoords: Coords | null) {
  const driverId = useDriverStore((s) => s.driver.id)
  const isOnline = useDriverStore((s) => s.driver.isOnline)
  const enabled = useUserPrefs((s) => s.geolocPushEnabled)
  const lastPushAtRef = useRef(0)

  useEffect(() => {
    if (!driverId || !isOnline || !enabled || !userCoords) return

    const push = () => {
      const now = Date.now()
      if (now - lastPushAtRef.current < PUSH_INTERVAL_MS) return
      lastPushAtRef.current = now
      driverService.updatePosition(driverId, userCoords.lat, userCoords.lng).catch(() => { /* silencieux */ })
    }
    push()
    const id = setInterval(push, PUSH_INTERVAL_MS)
    return () => clearInterval(id)
  }, [driverId, isOnline, enabled, userCoords?.lat, userCoords?.lng])
}
