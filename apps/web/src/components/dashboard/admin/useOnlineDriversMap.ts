'use client'

import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { adminAnalyticsService, type OnlineDriver } from '@/services/adminAnalyticsService'

const MAPBOX_STYLE = 'streets-v12'
const OSM_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const REFRESH_MS = 10_000

const driverIcon = L.divIcon({
  className: 'admin-driver-pin',
  html: '<div style="width:18px;height:18px;border-radius:50%;background:#FFD11A;border:3px solid #0A0A0A;box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

export function useOnlineDriversMap(containerRef: React.RefObject<HTMLDivElement | null>) {
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<Map<string, L.Marker>>(new Map())
  const hasFitRef = useRef(false)
  const [drivers, setDrivers] = useState<OnlineDriver[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Init map (une seule fois)
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: false,
      scrollWheelZoom: true,
    }).setView([46.5, 2.5], 6) // centre France par défaut

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

  // Fetch initial + polling 10s
  useEffect(() => {
    let cancelled = false
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
    load()
    const id = setInterval(load, REFRESH_MS)
    return () => { cancelled = true; clearInterval(id) }
  }, [])

  // Sync markers with drivers (update in place pour éviter le flicker)
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const next = new Set(drivers.map((d) => d.userId))

    markersRef.current.forEach((marker, id) => {
      if (!next.has(id)) {
        map.removeLayer(marker)
        markersRef.current.delete(id)
      }
    })

    for (const d of drivers) {
      const popupHtml = `<div style="font-family:Inter,sans-serif"><strong>${escapeHtml(d.name)}</strong>${d.phone ? `<br/><a href="tel:${d.phone}" style="color:#3B82F6">${escapeHtml(d.phone)}</a>` : ''}<br/><small style="color:#6b7280">Mis à jour: ${formatRelative(d.updatedAt)}</small></div>`
      const existing = markersRef.current.get(d.userId)
      if (existing) {
        existing.setLatLng([d.lat, d.lng])
        existing.setPopupContent(popupHtml)
      } else {
        const marker = L.marker([d.lat, d.lng], { icon: driverIcon, title: d.name }).bindPopup(popupHtml)
        marker.addTo(map)
        markersRef.current.set(d.userId, marker)
      }
    }

    if (!hasFitRef.current && drivers.length > 0) {
      const bounds = L.latLngBounds(drivers.map((d) => [d.lat, d.lng] as [number, number]))
      map.fitBounds(bounds.pad(0.2), { maxZoom: 12 })
      hasFitRef.current = true
    }
  }, [drivers])

  return { drivers, loading, error }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] ?? c))
}

function formatRelative(iso: string): string {
  const diffSec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diffSec < 60) return `il y a ${diffSec}s`
  if (diffSec < 3600) return `il y a ${Math.floor(diffSec / 60)} min`
  return `il y a ${Math.floor(diffSec / 3600)} h`
}
