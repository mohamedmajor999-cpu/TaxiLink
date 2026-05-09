'use client'
import { useCallback, useState } from 'react'
import type { Mission } from '@/lib/supabase/types'
import { useMissionRealtime } from '@/hooks/useMissionRealtime'
import { useDriverStore } from '@/store/driverStore'
import { useUserPrefs } from '@/store/userPrefsStore'
import { useAuth } from '@/hooks/useAuth'
import { haversineKm, type LatLng } from '@/lib/geoDistance'
import { playNotificationSound } from '@/lib/playNotificationSound'

const WINDOW_MS = 2 * 60 * 60 * 1000 // 2 heures
const RADIUS_KM = 15

interface Args {
  userCoords: LatLng | null
}

/**
 * Ecoute les inserts realtime de missions et alimente une file FIFO de
 * popups. Filtre : popupEnabled + isOnline + not own + 2h window + 15km radius.
 * Channel dedie pour eviter le conflit de subscribe avec useDriverMissions.
 */
export function useNewMissionPopup({ userCoords }: Args) {
  const [queue, setQueue] = useState<Mission[]>([])
  const popupEnabled = useUserPrefs((s) => s.popupNewMission)
  const isOnline = useDriverStore((s) => s.driver.isOnline)
  const { user } = useAuth()
  const driverId = useDriverStore((s) => s.driver.id)
  // Source de verite pour "est-ce ma propre annonce" : on prefere user.id de
  // useAuth (defini des l'auth resolue) avec fallback sur driverStore. Si
  // aucune des deux n'est connue, on n'affiche rien (mieux que de risquer un
  // faux positif sur l'auteur).
  const ownId = user?.id ?? driverId ?? null

  useMissionRealtime({
    onInsert: (m) => {
      if (!popupEnabled || !isOnline) return
      if (!ownId) return
      if (m.shared_by === ownId) return
      if (!matchesWindow(m)) return
      if (!matchesRadius(m, userCoords)) return
      setQueue((prev) => {
        if (prev.some((x) => x.id === m.id)) return prev
        playNotificationSound()
        return [...prev, m]
      })
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
