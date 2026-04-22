'use client'
import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface LatLng { lat: number; lng: number }

const MAPBOX_STYLE = 'streets-v12'
const OSM_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

const startIcon = L.divIcon({
  className: 'course-map-icon',
  html: '<div style="width:14px;height:14px;border-radius:50%;background:#FFD11A;border:3px solid #0A0A0A;box-shadow:0 2px 6px rgba(0,0,0,0.35);"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
})

const endIcon = L.divIcon({
  className: 'course-map-icon',
  html: `<div style="position:relative;width:28px;height:36px;">
    <div style="position:absolute;left:50%;top:0;transform:translateX(-50%);width:28px;height:28px;border-radius:50%;background:#0A0A0A;border:3px solid #FFD11A;box-shadow:0 3px 8px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;">
      <div style="width:8px;height:8px;border-radius:50%;background:#FFD11A;"></div>
    </div>
    <div style="position:absolute;left:50%;top:24px;transform:translateX(-50%);width:2px;height:10px;background:#0A0A0A;"></div>
  </div>`,
  iconSize: [28, 36],
  iconAnchor: [14, 34],
})

export function useCourseMap({
  from,
  to,
  routeGeometry,
}: {
  from: LatLng
  to: LatLng
  routeGeometry?: GeoJSON.LineString | null
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const routeLayerRef = useRef<L.GeoJSON | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: false,
      scrollWheelZoom: true,
    })
    if (token) {
      L.tileLayer(
        `https://api.mapbox.com/styles/v1/mapbox/${MAPBOX_STYLE}/tiles/{z}/{x}/{y}@2x?access_token=${token}`,
        { maxZoom: 19, tileSize: 512, zoomOffset: -1 },
      ).addTo(map)
    } else {
      L.tileLayer(OSM_URL, { maxZoom: 19 }).addTo(map)
    }
    L.marker([from.lat, from.lng], { icon: startIcon, title: 'Départ' }).addTo(map)
    L.marker([to.lat, to.lng], { icon: endIcon, title: 'Arrivée' }).addTo(map)
    map.fitBounds(L.latLngBounds([[from.lat, from.lng], [to.lat, to.lng]]).pad(0.3))
    mapRef.current = map
    return () => { map.remove(); mapRef.current = null }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current)
      routeLayerRef.current = null
    }
    if (routeGeometry) {
      const halo = L.geoJSON(routeGeometry as GeoJSON.GeoJsonObject, {
        style: { color: '#FFFFFF', weight: 8, opacity: 0.9 },
      }).addTo(map)
      const line = L.geoJSON(routeGeometry as GeoJSON.GeoJsonObject, {
        style: { color: '#0A0A0A', weight: 5, opacity: 1 },
      }).addTo(map)
      const group = L.featureGroup([halo, line])
      routeLayerRef.current = line
      const bounds = group.getBounds()
      if (bounds.isValid()) map.fitBounds(bounds.pad(0.15))
    }
  }, [routeGeometry])

  return { containerRef }
}
