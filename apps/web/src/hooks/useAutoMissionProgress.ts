'use client'
import { useEffect, useRef, useState } from 'react'
import type { Mission } from '@/lib/supabase/types'
import { useAuth } from '@/hooks/useAuth'
import { useDriverStore } from '@/store/driverStore'
import { useGpsStore } from '@/store/gpsStore'
import { useUserPrefs } from '@/store/userPrefsStore'
import { useMissionStore } from '@/store/missionStore'
import { missionService } from '@/services/missionService'
import { missionProgressMutations } from '@/services/missionProgressMutations'
import { checkGeofence, haversineMeters, INITIAL_DWELL, type DwellState, type LatLng } from '@/lib/geofence'

const PICKUP_RADIUS_M = 80
const DEST_RADIUS_M = 100
const DWELL_MS = 2 * 60 * 1000
const LEAVE_PICKUP_M = 150
const LEAVE_DEST_M = 200
const MAX_ACCURACY_M = 40
const AUTO_COMPLETE_DELAY_MS = 60 * 1000

// Watcher unique au niveau du DriverDashboard. À chaque tick GPS reçu via
// useGpsStore, évalue où en est la course IN_PROGRESS et marque les jalons :
//   1. arrivé au pickup (geofence 80 m, 2 min de dwell) → arrived_at_pickup_at
//      (+ enroute_at en passant s'il manquait)
//   2. quitte la zone pickup (>150 m) → pickup_at
//   3. arrivé à destination (geofence 100 m, 2 min) → arrived_at_dest_at
//   4. quitte la zone destination (>200 m) → dropoff_at
//   5. si type PRIVE et > 60 s après dropoff → complete()
//
// Désactivé si le chauffeur a refusé le partage GPS (geolocPushEnabled=false)
// ou s'il est offline. CPAM n'est pas auto-clôturé : la signature/voucher
// reste un acte explicite côté chauffeur.
export function useAutoMissionProgress(): void {
  const { user } = useAuth()
  const isOnline = useDriverStore((s) => s.driver.isOnline)
  const enabled = useUserPrefs((s) => s.geolocPushEnabled)
  const coords = useGpsStore((s) => s.coords)
  const accuracyM = useGpsStore((s) => s.accuracyM)
  const storedCurrentId = useMissionStore((s) => s.currentMission?.id ?? null)
  const dismissStoreCurrent = useMissionStore((s) => s.dismissCurrentMission)
  const [mission, setMission] = useState<Mission | null>(null)

  const pickupDwellRef = useRef<DwellState>(INITIAL_DWELL)
  const destDwellRef = useRef<DwellState>(INITIAL_DWELL)
  const completingRef = useRef(false)

  useEffect(() => {
    if (!user?.id || !isOnline || !enabled) {
      setMission(null)
      return
    }
    let cancelled = false
    missionService.getCurrentForDriver(user.id)
      .then((m) => { if (!cancelled) setMission(m) })
      .catch(() => { /* silencieux : auto-progression est best-effort */ })
    return () => { cancelled = true }
  }, [user?.id, isOnline, enabled, storedCurrentId])

  useEffect(() => {
    pickupDwellRef.current = INITIAL_DWELL
    destDwellRef.current = INITIAL_DWELL
    completingRef.current = false
  }, [mission?.id])

  useEffect(() => {
    if (!enabled || !isOnline) return
    if (!mission || mission.status !== 'IN_PROGRESS') return
    if (!coords || accuracyM == null || accuracyM > MAX_ACCURACY_M) return

    const now = Date.now()
    const id = mission.id

    if (!mission.arrived_at_pickup_at && mission.departure_lat != null && mission.departure_lng != null) {
      const target: LatLng = { lat: mission.departure_lat, lng: mission.departure_lng }
      const r = checkGeofence({ state: pickupDwellRef.current, position: coords, target, radiusM: PICKUP_RADIUS_M, dwellMs: DWELL_MS, now })
      pickupDwellRef.current = r.state
      if (r.justConfirmed) {
        const tasks: Promise<void>[] = []
        if (!mission.enroute_at) tasks.push(missionProgressMutations.markEnRoute(id))
        tasks.push(missionProgressMutations.markArrivedAtPickup(id))
        Promise.all(tasks).then(() => {
          const iso = new Date(now).toISOString()
          setMission((prev) => prev ? { ...prev, enroute_at: prev.enroute_at ?? iso, arrived_at_pickup_at: iso } : prev)
        }).catch(() => { /* silencieux */ })
      }
      return
    }

    if (mission.arrived_at_pickup_at && !mission.pickup_at && mission.departure_lat != null && mission.departure_lng != null) {
      const dist = haversineMeters(coords, { lat: mission.departure_lat, lng: mission.departure_lng })
      if (dist > LEAVE_PICKUP_M) {
        missionProgressMutations.markOnBoard(id).then(() => {
          setMission((prev) => prev ? { ...prev, pickup_at: new Date(now).toISOString() } : prev)
        }).catch(() => { /* silencieux */ })
      }
      return
    }

    if (mission.pickup_at && !mission.arrived_at_dest_at && mission.destination_lat != null && mission.destination_lng != null) {
      const target: LatLng = { lat: mission.destination_lat, lng: mission.destination_lng }
      const r = checkGeofence({ state: destDwellRef.current, position: coords, target, radiusM: DEST_RADIUS_M, dwellMs: DWELL_MS, now })
      destDwellRef.current = r.state
      if (r.justConfirmed) {
        missionProgressMutations.markArrivedAtDest(id).then(() => {
          setMission((prev) => prev ? { ...prev, arrived_at_dest_at: new Date(now).toISOString() } : prev)
        }).catch(() => { /* silencieux */ })
      }
      return
    }

    if (mission.arrived_at_dest_at && !mission.dropoff_at && mission.destination_lat != null && mission.destination_lng != null) {
      const dist = haversineMeters(coords, { lat: mission.destination_lat, lng: mission.destination_lng })
      if (dist > LEAVE_DEST_M) {
        missionProgressMutations.markDropped(id).then(() => {
          setMission((prev) => prev ? { ...prev, dropoff_at: new Date(now).toISOString() } : prev)
        }).catch(() => { /* silencieux */ })
      }
      return
    }

    if (mission.dropoff_at && mission.type === 'PRIVE' && !completingRef.current) {
      const droppedAt = new Date(mission.dropoff_at).getTime()
      if (now - droppedAt > AUTO_COMPLETE_DELAY_MS) {
        completingRef.current = true
        missionService.complete(id).then(() => {
          setMission(null)
          dismissStoreCurrent()
        }).catch(() => { completingRef.current = false })
      }
    }
  }, [coords, accuracyM, enabled, isOnline, mission, dismissStoreCurrent])
}
