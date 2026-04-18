'use client'
import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface LatLng { lat: number; lng: number }

interface Props {
  from: LatLng
  to: LatLng
  routeGeometry?: GeoJSON.LineString | null
}

const startIcon = L.divIcon({
  className: 'course-map-icon',
  html: '<div style="width:16px;height:16px;border-radius:50%;background:#FFD11A;border:3px solid #0A0A0A;box-shadow:0 2px 4px rgba(0,0,0,0.3);"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

const endIcon = L.divIcon({
  className: 'course-map-icon',
  html: '<div style="width:18px;height:18px;border-radius:50%;background:#0A0A0A;border:3px solid #FFD11A;box-shadow:0 2px 4px rgba(0,0,0,0.3);"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

export function CourseMap({ from, to, routeGeometry }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const routeLayerRef = useRef<L.GeoJSON | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: true,
    })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map)
    L.marker([from.lat, from.lng], { icon: startIcon, title: 'Départ' }).addTo(map)
    L.marker([to.lat, to.lng], { icon: endIcon, title: 'Arrivée' }).addTo(map)
    map.fitBounds(L.latLngBounds([[from.lat, from.lng], [to.lat, to.lng]]).pad(0.3))
    mapRef.current = map
    return () => { map.remove(); mapRef.current = null }
    // Mission stable sur la durée de la vue : init unique au montage
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
      const layer = L.geoJSON(routeGeometry as GeoJSON.GeoJsonObject, {
        style: { color: '#0A0A0A', weight: 5, opacity: 0.9 },
      }).addTo(map)
      routeLayerRef.current = layer
      const bounds = layer.getBounds()
      if (bounds.isValid()) map.fitBounds(bounds.pad(0.15))
    }
  }, [routeGeometry])

  return <div ref={containerRef} className="absolute inset-0" aria-label="Carte de l'itinéraire" />
}
