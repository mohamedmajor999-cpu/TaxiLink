'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { PatronFleetMember } from '@/services/patronFleetService'
import {
  injectPinKeyframesOnce, makePinIcon, buildTileLayer, escapeHtml, spiderfyCoincident,
  type TileMode, type PositionedDriver,
} from './fleetMapHelpers'

export type { TileMode } from './fleetMapHelpers'

export function usePatronFleetMap(
  containerRef: React.RefObject<HTMLDivElement | null>,
  fleet: PatronFleetMember[],
  tileMode: TileMode = 'street'
) {
  const mapRef = useRef<L.Map | null>(null)
  const tileLayerRef = useRef<L.TileLayer | null>(null)
  const markersRef = useRef<Map<string, L.Marker>>(new Map())
  const hasFitRef = useRef(false)
  const [mapReady, setMapReady] = useState(false)

  useEffect(() => {
    injectPinKeyframesOnce()
    if (!containerRef.current || mapRef.current) return
    const map = L.map(containerRef.current, { zoomControl: false, attributionControl: false, scrollWheelZoom: true }).setView([46.5, 2.5], 6)
    const initialMode: TileMode = tileMode
    tileLayerRef.current = buildTileLayer(initialMode).addTo(map)
    mapRef.current = map
    setMapReady(true)
    return () => {
      map.remove()
      mapRef.current = null
      tileLayerRef.current = null
      markersRef.current.clear()
      hasFitRef.current = false
      setMapReady(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !tileLayerRef.current) return
    map.removeLayer(tileLayerRef.current)
    tileLayerRef.current = buildTileLayer(tileMode).addTo(map)
  }, [tileMode])

  useEffect(() => {
    if (!mapReady) return
    const map = mapRef.current
    if (!map) return
    const positioned: PositionedDriver[] = fleet.filter((d): d is PositionedDriver => d.lat != null && d.lng != null)
    const offsets = spiderfyCoincident(positioned)
    const next = new Set(positioned.map((d) => d.id))
    markersRef.current.forEach((marker, id) => {
      if (!next.has(id)) { map.removeLayer(marker); markersRef.current.delete(id) }
    })
    for (const d of positioned) {
      const [lat, lng] = offsets.get(d.id) ?? [d.lat, d.lng]
      const popupHtml = `<div style="font-family:Inter,sans-serif"><strong>${escapeHtml(d.name)}</strong><br/><small style="color:#6b7280">${d.todayMissions} courses · ${d.todayRevenue}€ aujourd'hui</small></div>`
      const existing = markersRef.current.get(d.id)
      if (existing) {
        existing.setLatLng([lat, lng]); existing.setIcon(makePinIcon(d.status, d.initials)); existing.setPopupContent(popupHtml)
      } else {
        const marker = L.marker([lat, lng], { icon: makePinIcon(d.status, d.initials), title: d.name }).bindPopup(popupHtml)
        marker.addTo(map); markersRef.current.set(d.id, marker)
      }
    }
    if (!hasFitRef.current && positioned.length > 0) {
      const bounds = L.latLngBounds(positioned.map((d) => [d.lat, d.lng] as [number, number]))
      map.fitBounds(bounds.pad(0.2), { maxZoom: 13 })
      hasFitRef.current = true
    }
  }, [mapReady, fleet])

  const zoomIn = useCallback(() => mapRef.current?.zoomIn(), [])
  const zoomOut = useCallback(() => mapRef.current?.zoomOut(), [])
  const invalidateSize = useCallback(() => mapRef.current?.invalidateSize(), [])

  return { zoomIn, zoomOut, invalidateSize }
}
