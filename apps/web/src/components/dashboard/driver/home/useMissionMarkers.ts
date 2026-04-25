'use client'
import { useEffect, useRef, type RefObject } from 'react'
import type { Map as LeafletMap, Marker } from 'leaflet'
import type { Mission } from '@/lib/supabase/types'
import { getMinutesUntil } from '@/lib/dateUtils'
import { createMissionPinIcon, formatMissionPriceLabel } from './missionMapPin'

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
      const seen = new Set<string>()
      for (const m of missions) {
        if (m.departure_lat == null || m.departure_lng == null) continue
        seen.add(m.id)
        const priceLabel = formatMissionPriceLabel(m)
        const urgent = getMinutesUntil(m.scheduled_at) <= URGENT_THRESHOLD_MIN
        const selected = m.id === selectedId
        const sig = `${priceLabel}|${selected}|${urgent}`
        const existing = markersRef.current.get(m.id)
        if (existing) {
          existing.setLatLng([m.departure_lat, m.departure_lng])
          if (existing.__sig !== sig) {
            const icon = await createMissionPinIcon({ priceLabel, selected, urgent })
            if (cancelled) return
            existing.setIcon(icon)
            existing.__sig = sig
          }
        } else {
          const icon = await createMissionPinIcon({ priceLabel, selected, urgent })
          if (cancelled) return
          const marker = L.marker([m.departure_lat, m.departure_lng], { icon, riseOnHover: true })
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
    const mission = missionsRef.current.find((x) => x.id === selectedId)
    if (!mission || mission.departure_lat == null || mission.departure_lng == null) return
    map.flyTo([mission.departure_lat, mission.departure_lng], Math.max(map.getZoom(), 14), { duration: 0.5 })
  }, [selectedId, mapRef])
}
