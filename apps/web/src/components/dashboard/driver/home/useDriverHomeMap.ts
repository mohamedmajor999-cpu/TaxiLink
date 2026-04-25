'use client'
import { useCallback, useEffect, useRef } from 'react'
import type { Map as LeafletMap, Marker, Circle } from 'leaflet'
import { createMeMarkerIcon } from './missionMapPin'

const MARSEILLE_FALLBACK: [number, number] = [43.2965, 5.3698]
const MAPBOX_STYLE_DAY = 'streets-v12'
const MAPBOX_STYLE_NIGHT = 'navigation-night-v1'
const OSM_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

interface Params {
  userCoords: { lat: number; lng: number } | null
  userAccuracy: number | null
  night?: boolean
}

export function useDriverHomeMap({ userCoords, userAccuracy, night }: Params) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const meMarkerRef = useRef<Marker | null>(null)
  const accuracyCircleRef = useRef<Circle | null>(null)
  const tileLayerRef = useRef<import('leaflet').TileLayer | null>(null)
  const userCoordsRef = useRef(userCoords)
  userCoordsRef.current = userCoords

  const recenter = useCallback(() => {
    const map = mapRef.current
    const coords = userCoordsRef.current
    if (!map || !coords) return
    map.flyTo([coords.lat, coords.lng], Math.max(map.getZoom(), 15), { duration: 0.5 })
  }, [])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    let cancelled = false
    let observer: ResizeObserver | null = null
    ;(async () => {
      const L = (await import('leaflet')).default
      if (cancelled || !containerRef.current) return
      const center = userCoords ?? { lat: MARSEILLE_FALLBACK[0], lng: MARSEILLE_FALLBACK[1] }
      const map = L.map(containerRef.current, {
        zoomControl: true,
        attributionControl: false,
        scrollWheelZoom: true,
      }).setView([center.lat, center.lng], 13)
      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
      if (token) {
        const style = night ? MAPBOX_STYLE_NIGHT : MAPBOX_STYLE_DAY
        tileLayerRef.current = L.tileLayer(
          `https://api.mapbox.com/styles/v1/mapbox/${style}/tiles/{z}/{x}/{y}@2x?access_token=${token}`,
          { maxZoom: 19, tileSize: 512, zoomOffset: -1 },
        ).addTo(map)
      } else {
        tileLayerRef.current = L.tileLayer(OSM_URL, { maxZoom: 19 }).addTo(map)
      }
      map.zoomControl.setPosition('bottomleft')
      mapRef.current = map
      setTimeout(() => map.invalidateSize(), 50)
      setTimeout(() => map.invalidateSize(), 300)
      // Suit les changements de taille du conteneur (drag du sheet sur mobile, resize fenetre)
      // pour eviter les zones grises (tuiles non chargees) quand la carte grandit.
      observer = new ResizeObserver(() => map.invalidateSize())
      observer.observe(containerRef.current!)
    })()
    return () => {
      cancelled = true
      observer?.disconnect()
      mapRef.current?.remove()
      mapRef.current = null
      meMarkerRef.current = null
    }
  }, [])

  // Hot-swap des tuiles quand on bascule jour/nuit (sans demonter la carte).
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const map = mapRef.current
      if (!map) return
      const L = (await import('leaflet')).default
      if (cancelled) return
      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
      const next = token
        ? L.tileLayer(
            `https://api.mapbox.com/styles/v1/mapbox/${night ? MAPBOX_STYLE_NIGHT : MAPBOX_STYLE_DAY}/tiles/{z}/{x}/{y}@2x?access_token=${token}`,
            { maxZoom: 19, tileSize: 512, zoomOffset: -1 },
          )
        : L.tileLayer(OSM_URL, { maxZoom: 19 })
      next.addTo(map)
      const prev = tileLayerRef.current
      tileLayerRef.current = next
      if (prev) setTimeout(() => prev.remove(), 200)
    })()
    return () => { cancelled = true }
  }, [night])

  const didCenterOnUserRef = useRef(false)
  useEffect(() => {
    const map = mapRef.current
    if (!map || !userCoords) return
    let cancelled = false
    ;(async () => {
      const L = (await import('leaflet')).default
      if (cancelled) return
      const pos: [number, number] = [userCoords.lat, userCoords.lng]
      if (meMarkerRef.current) {
        meMarkerRef.current.setLatLng(pos)
      } else {
        const icon = await createMeMarkerIcon()
        if (cancelled) return
        meMarkerRef.current = L.marker(pos, { icon, interactive: false, keyboard: false, zIndexOffset: 1000 }).addTo(map)
      }
      const showAccuracy = userAccuracy != null && userAccuracy > 0 && userAccuracy <= 200
      if (showAccuracy) {
        if (accuracyCircleRef.current) {
          accuracyCircleRef.current.setLatLng(pos).setRadius(userAccuracy!)
        } else {
          accuracyCircleRef.current = L.circle(pos, {
            radius: userAccuracy!,
            color: '#3B82F6',
            weight: 1,
            opacity: 0.4,
            fillColor: '#3B82F6',
            fillOpacity: 0.1,
            interactive: false,
          }).addTo(map)
        }
      } else if (accuracyCircleRef.current) {
        accuracyCircleRef.current.remove()
        accuracyCircleRef.current = null
      }
      if (!didCenterOnUserRef.current) {
        map.flyTo(pos, 15, { duration: 0.6 })
        didCenterOnUserRef.current = true
      }
    })()
    return () => { cancelled = true }
  }, [userCoords, userAccuracy])

  return { containerRef, recenter, mapRef }
}
