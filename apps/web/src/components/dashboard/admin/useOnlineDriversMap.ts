'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { adminAnalyticsService, type OnlineDriver } from '@/services/adminAnalyticsService'
import { createClient } from '@/lib/supabase/client'
import { buildDriverIcon, driverPopupHtml } from './onlineDriverMapHelpers'

const MAPBOX_STYLE = 'streets-v12'
const OSM_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
// Polling fallback : Realtime fournit < 1s en nominal, on garde un filet
// au cas ou le canal drop (reconnexion reseau).
const FALLBACK_POLL_MS = 30_000
const REALTIME_DEBOUNCE_MS = 400

export function useOnlineDriversMap(containerRef: React.RefObject<HTMLDivElement | null>) {
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<Map<string, L.Marker>>(new Map())
  const hasFitRef = useRef(false)
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'drivers' }, scheduleReload)
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
