'use client'
import { useEffect, useRef, type RefObject } from 'react'
import type { Map as LeafletMap, Marker } from 'leaflet'
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

export function useMissionMarkers({ mapRef, missions, selectedId, onSelect }: Params) {
  const markersRef = useRef<Map<string, MarkerWithSig>>(new Map())
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect
  // Les effets ne depend pas de `missions` pour le flyTo : evite la relance a chaque
  // diff realtime. On lit la derniere valeur via ref au moment du changement de selection.
  const missionsRef = useRef(missions)
  missionsRef.current = missions

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    let cancelled = false
    ;(async () => {
      const L = (await import('leaflet')).default
      if (cancelled) return
      const positions = computeMarkerPositions(missions)
      const seen = new Set<string>()
      for (const m of missions) {
        const pos = positions.get(m.id)
        if (!pos) continue
        seen.add(m.id)
        const priceLabel = formatMissionPriceLabel(m)
        const urgent = getMinutesUntil(m.scheduled_at) <= URGENT_THRESHOLD_MIN
        const selected = m.id === selectedId
        const sig = `${priceLabel}|${selected}|${urgent}`
        const existing = markersRef.current.get(m.id)
        if (existing) {
          existing.setLatLng(pos)
          if (existing.__sig !== sig) {
            const icon = await createMissionPinIcon({ priceLabel, selected, urgent })
            if (cancelled) return
            existing.setIcon(icon)
            existing.__sig = sig
          }
        } else {
          const icon = await createMissionPinIcon({ priceLabel, selected, urgent })
          if (cancelled) return
          const marker = L.marker(pos, { icon, riseOnHover: true })
            .on('click', () => onSelectRef.current(m.id))
            .addTo(map) as MarkerWithSig
          marker.__sig = sig
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
  }, [missions, selectedId, mapRef])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !selectedId) return
    const positions = computeMarkerPositions(missionsRef.current)
    const pos = positions.get(selectedId)
    if (!pos) return
    map.flyTo(pos, Math.max(map.getZoom(), 14), { duration: 0.5 })
  }, [selectedId, mapRef])
}
