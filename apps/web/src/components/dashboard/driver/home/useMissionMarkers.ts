'use client'
import { useEffect, useRef, type RefObject } from 'react'
import type { Map as LeafletMap, Marker, MarkerClusterGroup } from 'leaflet'
import type { Mission } from '@/lib/supabase/types'
import { getMinutesUntil } from '@/lib/dateUtils'
import { createMissionPinIcon, formatMissionPriceLabel } from './missionMapPin'
import { computeMarkerPositions } from './markerOffset'

const URGENT_THRESHOLD_MIN = 10

type MarkerWithSig = Marker & { __sig?: string }

interface Params {
  mapRef: RefObject<LeafletMap | null>
  missions: Mission[]
  selectedId: string | null
  onSelect: (id: string) => void
}

// Genere l'icone d'un cluster (sphere jaune avec compteur). La taille
// croit avec la densite : sm < 10, md < 50, lg sinon.
function clusterIconHtml(count: number): { html: string; className: string; size: number } {
  const sizeClass = count < 10 ? '' : count < 50 ? 'lg' : 'xl'
  const size = count < 10 ? 44 : count < 50 ? 56 : 68
  const html = `<div class="mission-cluster ${sizeClass}">${count}</div>`
  return { html, className: '', size }
}

export function useMissionMarkers({ mapRef, missions, selectedId, onSelect }: Params) {
  const clusterGroupRef = useRef<MarkerClusterGroup | null>(null)
  const markersRef = useRef<Map<string, MarkerWithSig>>(new Map())
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect
  const missionsRef = useRef(missions)
  missionsRef.current = missions

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    let cancelled = false
    ;(async () => {
      const L = (await import('leaflet')).default
      await import('leaflet.markercluster')
      if (cancelled) return
      // Cree le groupe une fois et le reutilise. Important : sans
      // ce groupe persistant, chaque diff realtime detruirait/recreerait
      // tous les markers (spider/expand state perdu, flicker visuel).
      if (!clusterGroupRef.current) {
        const group = L.markerClusterGroup({
          maxClusterRadius: 35,
          spiderfyOnMaxZoom: true,
          showCoverageOnHover: false,
          zoomToBoundsOnClick: true,
          chunkedLoading: true,
          iconCreateFunction: (c) => {
            const cfg = clusterIconHtml(c.getChildCount())
            return L.divIcon({
              html: cfg.html,
              className: cfg.className,
              iconSize: [cfg.size, cfg.size],
              iconAnchor: [cfg.size / 2, cfg.size / 2],
            })
          },
        })
        clusterGroupRef.current = group
        map.addLayer(group)
      }
      const group = clusterGroupRef.current!
      const positions = computeMarkerPositions(missions)
      const seen = new Set<string>()
      for (const m of missions) {
        const pos = positions.get(m.id)
        if (!pos) continue
        seen.add(m.id)
        const priceLabel = formatMissionPriceLabel(m)
        const urgent = getMinutesUntil(m.scheduled_at) <= URGENT_THRESHOLD_MIN
        const selected = m.id === selectedId
        const medical = m.type === 'CPAM'
        const stale = m.status === 'STALE'
        const sig = `${priceLabel}|${selected}|${urgent}|${medical}|${stale}`
        const existing = markersRef.current.get(m.id)
        if (existing) {
          existing.setLatLng(pos)
          if (existing.__sig !== sig) {
            const icon = await createMissionPinIcon({ priceLabel, selected, urgent, medical, stale })
            if (cancelled) return
            existing.setIcon(icon)
            existing.__sig = sig
          }
        } else {
          const icon = await createMissionPinIcon({ priceLabel, selected, urgent, medical, stale })
          if (cancelled) return
          const marker = L.marker(pos, { icon, riseOnHover: true })
            .on('click', () => onSelectRef.current(m.id)) as MarkerWithSig
          marker.__sig = sig
          markersRef.current.set(m.id, marker)
          group.addLayer(marker)
        }
      }
      markersRef.current.forEach((marker, id) => {
        if (!seen.has(id)) {
          group.removeLayer(marker)
          markersRef.current.delete(id)
        }
      })
    })()
    return () => { cancelled = true }
  }, [missions, selectedId, mapRef])

  // Cleanup du groupe au demontage du hook (pas a chaque diff de missions).
  useEffect(() => {
    return () => {
      const map = mapRef.current
      const group = clusterGroupRef.current
      if (map && group) map.removeLayer(group)
      clusterGroupRef.current = null
      markersRef.current.clear()
    }
  }, [mapRef])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !selectedId) return
    const positions = computeMarkerPositions(missionsRef.current)
    const pos = positions.get(selectedId)
    if (!pos) return
    map.flyTo(pos, Math.max(map.getZoom(), 14), { duration: 0.5 })
  }, [selectedId, mapRef])
}
