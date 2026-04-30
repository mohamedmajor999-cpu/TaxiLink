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

export interface PopupDebug {
  events: number
  lastReason: string
  popupEnabled: boolean
  isOnline: boolean
  hasCoords: boolean
}

/**
 * Ecoute les inserts realtime de missions et alimente une file FIFO de
 * popups. Filtre : popupEnabled + isOnline + not own + 2h window + 15km radius.
 */
export function useNewMissionPopup({ userCoords, authorIdToSkip }: Args) {
  const [queue, setQueue] = useState<Mission[]>([])
  const [debug, setDebug] = useState<PopupDebug>({
    events: 0, lastReason: '—', popupEnabled: true, isOnline: false, hasCoords: false,
  })
  const popupEnabled = useUserPrefs((s) => s.popupNewMission)
  const isOnline = useDriverStore((s) => s.driver.isOnline)

  useMissionRealtime({
    channelName: 'missions-realtime-newpopup',
    onInsert: (m) => {
      const tag = (lastReason: string) => setDebug({
        events: debug.events + 1, lastReason, popupEnabled, isOnline, hasCoords: userCoords != null,
      })
      if (!popupEnabled) return tag('pref OFF')
      if (!isOnline) return tag('hors ligne')
      if (authorIdToSkip && m.shared_by === authorIdToSkip) return tag('propre annonce')
      if (!matchesWindow(m)) return tag(`hors fenêtre 2h (sched=${m.scheduled_at?.slice(11, 16) ?? '?'})`)
      if (!matchesRadius(m, userCoords)) return tag('hors rayon 15km')
      tag('ACCEPTÉ')
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

  return { current: queue[0] ?? null, dismiss, debug }
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
