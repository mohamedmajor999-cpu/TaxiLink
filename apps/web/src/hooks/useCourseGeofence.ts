'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Mission } from '@/lib/supabase/types'
import { missionService } from '@/services/missionService'
import { checkGeofence, INITIAL_DWELL, type DwellState, type LatLng } from '@/lib/geofence'

const PICKUP_RADIUS_M = 80
const DROPOFF_RADIUS_M = 100
const DWELL_MS = 2 * 60 * 1000
// Au-dela, la position GPS est trop bruitee pour declencher de facon fiable
// un geofence sur 80-100 m. Seuil = ~ moitie du plus petit rayon. On ignore
// le tick (sans toucher au state dwell) jusqu'au prochain reading propre.
const MAX_ACCURACY_M = 40

export type GeofenceStatus = 'idle' | 'searching' | 'pickup-zone' | 'onboard' | 'dropoff-zone' | 'denied' | 'unsupported'

export function useCourseGeofence(
  mission: Mission | null,
  onLocalUpdate: (next: Mission) => void,
) {
  const [enabled, setEnabled] = useState(false)
  const [status, setStatus] = useState<GeofenceStatus>('idle')
  const [position, setPosition] = useState<LatLng | null>(null)
  const [accuracyM, setAccuracyM] = useState<number | null>(null)

  const watchIdRef = useRef<number | null>(null)
  const pickupDwell = useRef<DwellState>(INITIAL_DWELL)
  const dropoffDwell = useRef<DwellState>(INITIAL_DWELL)
  const missionRef = useRef<Mission | null>(mission)
  missionRef.current = mission

  const evaluate = useCallback((pos: LatLng, now = Date.now()) => {
    const m = missionRef.current
    if (!m) return
    if (!m.pickup_at && m.departure_lat != null && m.departure_lng != null) {
      const target: LatLng = { lat: m.departure_lat, lng: m.departure_lng }
      const r = checkGeofence({
        state: pickupDwell.current, position: pos, target,
        radiusM: PICKUP_RADIUS_M, dwellMs: DWELL_MS, now,
      })
      pickupDwell.current = r.state
      if (r.state.phase !== 'outside') setStatus('pickup-zone')
      if (r.justConfirmed) {
        void missionService.markOnBoard(m.id).then(() => {
          onLocalUpdate({ ...m, pickup_at: new Date(now).toISOString() })
          setStatus('onboard')
        }).catch(() => {})
      }
    } else if (m.pickup_at && !m.dropoff_at && m.destination_lat != null && m.destination_lng != null) {
      const target: LatLng = { lat: m.destination_lat, lng: m.destination_lng }
      const r = checkGeofence({
        state: dropoffDwell.current, position: pos, target,
        radiusM: DROPOFF_RADIUS_M, dwellMs: DWELL_MS, now,
      })
      dropoffDwell.current = r.state
      if (r.state.phase !== 'outside') setStatus('dropoff-zone')
      if (r.justConfirmed) {
        void missionService.markDropped(m.id).then(() => {
          onLocalUpdate({ ...m, dropoff_at: new Date(now).toISOString() })
        }).catch(() => {})
      }
    }
  }, [onLocalUpdate])

  useEffect(() => {
    if (!enabled) return
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setStatus('unsupported')
      return
    }
    setStatus('searching')
    const id = navigator.geolocation.watchPosition(
      (geo) => {
        const pos = { lat: geo.coords.latitude, lng: geo.coords.longitude }
        setPosition(pos)
        setAccuracyM(geo.coords.accuracy)
        if (geo.coords.accuracy > MAX_ACCURACY_M) return
        evaluate(pos)
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) setStatus('denied')
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
    )
    watchIdRef.current = id
    return () => {
      if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
  }, [enabled, evaluate])

  return {
    enabled,
    enable: () => setEnabled(true),
    disable: () => setEnabled(false),
    status,
    position,
    accuracyM,
  }
}
