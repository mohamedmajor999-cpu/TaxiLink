'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Map as LeafletMap, Marker, Circle, TileLayer } from 'leaflet'
import { createDriverIcon } from './missionMapPin'
import { tilesFor, type MapView } from './mapTileLayers'

const MARSEILLE_FALLBACK: [number, number] = [43.2965, 5.3698]

interface Params {
  userCoords: { lat: number; lng: number } | null
  userAccuracy: number | null
  night?: boolean
}

export function useDriverHomeMap({ userCoords, userAccuracy, night }: Params) {
  const [view, setView] = useState<MapView>('street')
  const toggleView = useCallback(() => setView((v) => (v === 'street' ? 'satellite' : 'street')), [])
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const meMarkerRef = useRef<Marker | null>(null)
  const accuracyCircleRef = useRef<Circle | null>(null)
  // Plusieurs couches : satellite empile World Imagery + Transportation +
  // Reference (labels). Street : 1 seule couche.
  const tileLayersRef = useRef<TileLayer[]>([])
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
      // Pas de rotation : avec des tuiles raster Mapbox, les labels (rues,
      // villes) sont peints dans l'image et tourneraient avec la carte. La
      // seule facon d'avoir des labels droits = tuiles vectorielles
      // (MapLibre/Mapbox GL) — pas le scope ici. Ref : decision 2026-05-02.
      const map = L.map(containerRef.current, {
        zoomControl: true,
        attributionControl: false,
        scrollWheelZoom: true,
      }).setView([center.lat, center.lng], 9)
      tileLayersRef.current = tilesFor('street', night).map((s) =>
        L.tileLayer(s.url, s.opts).addTo(map),
      )
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

  // Hot-swap des tuiles quand on bascule jour/nuit OU street/satellite
  // (sans demonter la carte). Pour le satellite on empile 3 couches : image
  // Esri + transports + labels villes. La transition garde l'ancienne pile
  // visible 200 ms pour eviter le flash blanc pendant le chargement.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const map = mapRef.current
      if (!map) return
      const L = (await import('leaflet')).default
      if (cancelled) return
      const nextLayers = tilesFor(view, night).map((s) =>
        L.tileLayer(s.url, s.opts).addTo(map),
      )
      const prevLayers = tileLayersRef.current
      tileLayersRef.current = nextLayers
      if (prevLayers.length > 0) {
        setTimeout(() => prevLayers.forEach((l) => l.remove()), 200)
      }
    })()
    return () => { cancelled = true }
  }, [night, view])

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
        const icon = await createDriverIcon()
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
        // Auto-center sur l'user au zoom 9 : metropole Marseille + Aix +
        // Cavaillon/Manosque visibles. Cadrage par defaut valide en mai 2026
        // (cf screenshot user). Zoom manuel via pinch / bouton recenter.
        map.flyTo(pos, 9, { duration: 0.6 })
        didCenterOnUserRef.current = true
      }
    })()
    return () => { cancelled = true }
  }, [userCoords, userAccuracy])

  return { containerRef, recenter, mapRef, view, toggleView }
}
