'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { adminAnalyticsService, type OnlineDriver } from '@/services/adminAnalyticsService'
import { createClient } from '@/lib/supabase/client'
import { buildDriverIcon, driverPopupHtml } from './onlineDriverMapHelpers'

const MAPBOX_STYLE = 'streets-v12'
const OSM_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
// Realtime (postgres_changes sur `drivers`) patche les pins en < 1s. Le poll
// reste un filet : (a) si le canal drop, (b) pour les chauffeurs hors org de
// l'admin que la RLS exclut du realtime navigateur (l'API tourne en
// service-role et les voit, elle). 10s = compromis fraicheur / charge.
const FALLBACK_POLL_MS = 10_000
const REALTIME_DEBOUNCE_MS = 400

export function useOnlineDriversMap(containerRef: React.RefObject<HTMLDivElement | null>) {
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<Map<string, L.Marker>>(new Map())
  const hasFitRef = useRef(false)
  // Ids des chauffeurs deja en state : permet au handler realtime de decider
  // patch direct (chauffeur connu) vs reload complet (nouveau → besoin profil).
  const driverIdsRef = useRef<Set<string>>(new Set())
  const [drivers, setDrivers] = useState<OnlineDriver[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Tick d'horloge 1s pour mettre a jour le badge chrono sur chaque pin
  // (ex : "8s", "15s", "1m"...). nowMs est passe au builder d'icone, qui
  // calcule l'age du dernier fix et choisit la couleur. Demande user 2026-05-25.
  const [nowMs, setNowMs] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const withGps = useMemo(
    () => drivers.filter((d): d is OnlineDriver & { lat: number; lng: number; updatedAt: string } =>
      d.lat != null && d.lng != null && d.updatedAt != null
    ),
    [drivers],
  )

  useEffect(() => {
    driverIdsRef.current = new Set(drivers.map((d) => d.userId))
  }, [drivers])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: false,
      scrollWheelZoom: true,
    }).setView([46.5, 2.5], 6)

    if (token) {
      L.tileLayer(
        `https://api.mapbox.com/styles/v1/mapbox/${MAPBOX_STYLE}/tiles/{z}/{x}/{y}@2x?access_token=${token}`,
        { maxZoom: 19, tileSize: 512, zoomOffset: -1 },
      ).addTo(map)
    } else {
      L.tileLayer(OSM_URL, { maxZoom: 19 }).addTo(map)
    }
    mapRef.current = map
    return () => { map.remove(); mapRef.current = null }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    let cancelled = false
    let pendingTimer: ReturnType<typeof setTimeout> | null = null

    async function load() {
      try {
        const { items } = await adminAnalyticsService.getOnlineDrivers()
        if (!cancelled) { setDrivers(items); setError(null) }
      } catch (err) {
        if (!cancelled) setError((err as Error).message || 'Erreur chargement')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    function scheduleReload() {
      if (pendingTimer) return
      pendingTimer = setTimeout(() => { pendingTimer = null; if (!cancelled) load() }, REALTIME_DEBOUNCE_MS)
    }

    load()
    const pollId = setInterval(load, FALLBACK_POLL_MS)

    const supabase = createClient()
    const channel = supabase
      .channel('admin-online-drivers')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'drivers' }, (payload) => {
        const row = payload.new as {
          id?: string
          current_lat?: number | null
          current_lng?: number | null
          current_position_updated_at?: string | null
          is_online?: boolean
        }
        const id = row?.id ?? (payload.old as { id?: string })?.id
        // Chauffeur deja affiche + toujours en ligne : patch direct du pin
        // depuis le payload (pas de re-fetch API) → deplacement instantane.
        if (payload.eventType === 'UPDATE' && id && row.is_online !== false && driverIdsRef.current.has(id)) {
          setDrivers((prev) => prev.map((d) => d.userId === id ? {
            ...d,
            lat:       row.current_lat != null ? Number(row.current_lat) : d.lat,
            lng:       row.current_lng != null ? Number(row.current_lng) : d.lng,
            updatedAt: row.current_position_updated_at ?? d.updatedAt,
          } : d))
          return
        }
        // INSERT / passage offline / chauffeur inconnu → reload complet (profil).
        scheduleReload()
      })
      .subscribe()

    return () => {
      cancelled = true
      clearInterval(pollId)
      if (pendingTimer) clearTimeout(pendingTimer)
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const next = new Set(withGps.map((d) => d.userId))

    markersRef.current.forEach((marker, id) => {
      if (!next.has(id)) { map.removeLayer(marker); markersRef.current.delete(id) }
    })

    for (const d of withGps) {
      const popup = driverPopupHtml(d.name, d.phone, d.updatedAt)
      const icon = buildDriverIcon(d.updatedAt, nowMs)
      const existing = markersRef.current.get(d.userId)
      if (existing) {
        existing.setLatLng([d.lat, d.lng])
        existing.setIcon(icon)
        existing.setPopupContent(popup)
      } else {
        const marker = L.marker([d.lat, d.lng], { icon, title: d.name }).bindPopup(popup)
        marker.addTo(map)
        markersRef.current.set(d.userId, marker)
      }
    }

    if (!hasFitRef.current && withGps.length > 0) {
      const bounds = L.latLngBounds(withGps.map((d) => [d.lat, d.lng] as [number, number]))
      map.fitBounds(bounds.pad(0.2), { maxZoom: 12 })
      hasFitRef.current = true
    }
  }, [withGps, nowMs])

  return {
    drivers,
    withGpsCount:    withGps.length,
    withoutGpsCount: drivers.length - withGps.length,
    loading,
    error,
  }
}
