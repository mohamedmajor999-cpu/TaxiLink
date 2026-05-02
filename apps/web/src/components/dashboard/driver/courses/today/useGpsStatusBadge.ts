'use client'
import { useEffect, useState } from 'react'
import { useGpsStore } from '@/store/gpsStore'
import { useDriverStore } from '@/store/driverStore'
import { useUserPrefs } from '@/store/userPrefsStore'

export type GpsStatus =
  | 'offline'        // chauffeur n'est pas en ligne
  | 'disabled'       // pref geolocPushEnabled=false
  | 'blocked'        // permission navigateur refusée
  | 'prompt'         // permission jamais demandée ou pas encore accordée
  | 'searching'      // permission OK, mais pas encore reçu de coords
  | 'weak'           // coords reçues mais accuracy > 40m (le seuil du geofence)
  | 'active'         // tout OK : tracking auto fonctionnel

const ACCURACY_OK_M = 40

export function useGpsStatusBadge() {
  const isOnline = useDriverStore((s) => s.driver.isOnline)
  const enabled = useUserPrefs((s) => s.geolocPushEnabled)
  const coords = useGpsStore((s) => s.coords)
  const accuracyM = useGpsStore((s) => s.accuracyM)
  const [permission, setPermission] = useState<PermissionState | 'unknown'>('unknown')

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.permissions?.query) return
    let cancelled = false
    let perm: PermissionStatus | null = null
    const update = () => { if (perm && !cancelled) setPermission(perm.state) }
    navigator.permissions.query({ name: 'geolocation' as PermissionName })
      .then((p) => {
        if (cancelled) return
        perm = p
        setPermission(p.state)
        p.addEventListener('change', update)
      })
      .catch(() => { /* Safari ancien : on retombera sur la présence de coords */ })
    return () => {
      cancelled = true
      if (perm) perm.removeEventListener('change', update)
    }
  }, [])

  const status = computeStatus({ isOnline, enabled, permission, coords, accuracyM })
  return { status, accuracyM }
}

function computeStatus(p: {
  isOnline: boolean
  enabled: boolean
  permission: PermissionState | 'unknown'
  coords: { lat: number; lng: number } | null
  accuracyM: number | null
}): GpsStatus {
  if (!p.isOnline) return 'offline'
  if (!p.enabled) return 'disabled'
  if (p.permission === 'denied') return 'blocked'
  if (p.coords && p.accuracyM != null) return p.accuracyM <= ACCURACY_OK_M ? 'active' : 'weak'
  if (p.permission === 'granted') return 'searching'
  if (p.permission === 'prompt') return 'prompt'
  return 'searching'
}
