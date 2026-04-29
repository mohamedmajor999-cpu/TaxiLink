'use client'
import { useCallback, useState } from 'react'
import type { Mission } from '@/lib/supabase/types'
import { useMissionRealtime } from '@/hooks/useMissionRealtime'
import { useDriverStore } from '@/store/driverStore'
import { useUserPrefs } from '@/store/userPrefsStore'
import { haversineKm, type LatLng } from '@/lib/geoDistance'

const WINDOW_MS = 2 * 60 * 60 * 1000 // 2 heures
const RADIUS_KM = 15

interface Args {
  userCoords: LatLng | null
  authorIdToSkip?: string | null
}

/**
 * Ecoute les inserts realtime de missions et alimente une file FIFO de
 * popups. Filtre :
 * - mission.scheduled_at dans les 2 prochaines heures
 * - departure_lat/lng a moins de 15 km de userCoords (si dispo)
 * - mission postee par quelqu'un d'autre (pas le chauffeur courant)
 * - pref `popupNewMission` activee (default true)
 */
export function useNewMissionPopup({ userCoords, authorIdToSkip }: Args) {
  const [queue, setQueue] = useState<Mission[]>([])
  const popupEnabled = useUserPrefs((s) => s.popupNewMission)
  const isOnline = useDriverStore((s) => s.driver.isOnline)

  useMissionRealtime({
    // Channel dedie : useDriverMissions monte deja « missions-realtime » sur la
    // home, et Supabase refuse `.on(...)` apres `.subscribe()` sur un nom existant.
    channelName: 'missions-realtime-newpopup',
    onInsert: (m) => {
      if (!popupEnabled || !isOnline) return
      if (authorIdToSkip && m.shared_by === authorIdToSkip) return
      if (!matchesWindow(m)) return
      if (!matchesRadius(m, userCoords)) return
      setQueue((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]))
    },
    onDelete: ({ id }) => setQueue((prev) => prev.filter((m) => m.id !== id)),
    onUpdate: (m) => {
      if (m.status !== 'AVAILABLE') setQueue((prev) => prev.filter((x) => x.id !== m.id))
    },
  })

  const dismiss = useCallback((id: string) => {
    setQueue((prev) => prev.filter((m) => m.id !== id))
  }, [])

  return { current: queue[0] ?? null, dismiss }
}

function matchesWindow(m: Mission): boolean {
  if (!m.scheduled_at) return false
  const ts = new Date(m.scheduled_at).getTime()
  if (Number.isNaN(ts)) return false
  const now = Date.now()
  return ts >= now - 5 * 60_000 && ts <= now + WINDOW_MS
}

function matchesRadius(m: Mission, userCoords: LatLng | null): boolean {
  if (!userCoords) return true // sans geoloc, on ne filtre pas (mieux que rien)
  if (m.departure_lat == null || m.departure_lng == null) return true
  return haversineKm(userCoords, { lat: m.departure_lat, lng: m.departure_lng }) <= RADIUS_KM
}
