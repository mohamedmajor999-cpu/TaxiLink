'use client'
import { useCallback, useEffect, useRef } from 'react'
import type { Map as LeafletMap, Marker, Circle } from 'leaflet'
import type { Mission } from '@/lib/supabase/types'
import { computeDisplayFare } from '@/lib/missionFare'
import { getMinutesUntil } from '@/lib/dateUtils'
import { createMissionPinIcon, createMeMarkerIcon } from './missionMapPin'

const MARSEILLE_FALLBACK: [number, number] = [43.2965, 5.3698]
const URGENT_THRESHOLD_MIN = 10
const MAPBOX_STYLE = 'streets-v12'
const OSM_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

interface Params {
  missions: Mission[]
  userCoords: { lat: number; lng: number } | null
  userAccuracy: number | null
  selectedId: string | null
  onSelect: (id: string) => void
}

export function useDriverHomeMap({ missions, userCoords, userAccuracy, selectedId, onSelect }: Params) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const markersRef = useRef<Map<string, Marker>>(new Map())
  const meMarkerRef = useRef<Marker | null>(null)
  const accuracyCircleRef = useRef<Circle | null>(null)
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect
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
        L.tileLayer(
          `https://api.mapbox.com/styles/v1/mapbox/${MAPBOX_STYLE}/tiles/{z}/{x}/{y}@2x?access_token=${token}`,
          { maxZoom: 19, tileSize: 512, zoomOffset: -1 },
        ).addTo(map)
      } else {
        L.tileLayer(OSM_URL, { maxZoom: 19 }).addTo(map)
      }
      map.zoomControl.setPosition('bottomleft')
      mapRef.current = map
      setTimeout(() => map.invalidateSize(), 50)
      setTimeout(() => map.invalidateSize(), 300)
    })()
    return () => {
      cancelled = true
      mapRef.current?.remove()
      mapRef.current = null
      markersRef.current.clear()
      meMarkerRef.current = null
    }
  }, [])

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

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    let cancelled = false
    ;(async () => {
      const L = (await import('leaflet')).default
      if (cancelled) return
      const seen = new Set<string>()
      for (const m of missions) {
        if (m.departure_lat == null || m.departure_lng == null) continue
        seen.add(m.id)
        const priceLabel = formatPriceLabel(m)
        const urgent = getMinutesUntil(m.scheduled_at) <= URGENT_THRESHOLD_MIN
        const icon = await createMissionPinIcon({ priceLabel, selected: m.id === selectedId, urgent })
        if (cancelled) return
        const existing = markersRef.current.get(m.id)
        if (existing) {
          existing.setLatLng([m.departure_lat, m.departure_lng])
          existing.setIcon(icon)
        } else {
          const marker = L.marker([m.departure_lat, m.departure_lng], { icon, riseOnHover: true })
            .on('click', () => onSelectRef.current(m.id))
            .addTo(map)
          markersRef.current.set(m.id, marker)
        }
      }
      markersRef.current.forEach((marker, id) => {
        if (!seen.has(id)) {
          marker.remove()
          markersRef.current.delete(id)
        }
      })
    })()
    return () => { cancelled = true }
  }, [missions, selectedId])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !selectedId) return
    const mission = missions.find((x) => x.id === selectedId)
    if (!mission || mission.departure_lat == null || mission.departure_lng == null) return
    map.flyTo([mission.departure_lat, mission.departure_lng], Math.max(map.getZoom(), 14), { duration: 0.5 })
  }, [selectedId, missions])

  return { containerRef, recenter }
}

function formatPriceLabel(m: Mission): string {
  const fare = computeDisplayFare(m)
  const value = fare.value
  const rounded = Number.isInteger(value) ? value.toFixed(0) : value.toFixed(2).replace(/0$/, '').replace(/\.$/, '')
  return `${rounded.replace('.', ',')} €`
}
