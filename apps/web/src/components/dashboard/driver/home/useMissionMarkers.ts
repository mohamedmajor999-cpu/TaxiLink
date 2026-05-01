'use client'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import type { Map as LeafletMap, Marker } from 'leaflet'
import type { Mission } from '@/lib/supabase/types'
import { getMinutesUntil } from '@/lib/dateUtils'
import { createMissionPinIcon, formatMissionPriceLabel } from './missionMapPin'
import { clusterMissions, type MissionCluster } from './missionClusters'

const URGENT_THRESHOLD_MIN = 10

type MarkerWithSig = Marker & { __sig?: string }

interface Params {
  mapRef: RefObject<LeafletMap | null>
  missions: Mission[]
  selectedId: string | null
  onSelect: (id: string) => void
}

// Cle stable pour identifier un cluster (singleton ou stack).
function clusterKey(c: MissionCluster): string {
  return c.type === 'pin' ? c.mission.id : `stack:${c.leader.id}`
}

function clusterRepresentative(c: MissionCluster): Mission {
  return c.type === 'pin' ? c.mission : c.leader
}

function clusterCount(c: MissionCluster): number | undefined {
  return c.type === 'stack' ? c.missions.length : undefined
}

export function useMissionMarkers({ mapRef, missions, selectedId, onSelect }: Params) {
  const markersRef = useRef<Map<string, MarkerWithSig>>(new Map())
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect
  const clusters = useMemo(() => clusterMissions(missions), [missions])
  const clustersRef = useRef(clusters)
  clustersRef.current = clusters

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    let cancelled = false
    ;(async () => {
      const L = (await import('leaflet')).default
      if (cancelled) return
      const seen = new Set<string>()
      for (const c of clusters) {
        const key = clusterKey(c)
        seen.add(key)
        const rep = clusterRepresentative(c)
        const count = clusterCount(c)
        const priceLabel = formatMissionPriceLabel(rep)
        const urgent = getMinutesUntil(rep.scheduled_at) <= URGENT_THRESHOLD_MIN
        const isSelected = c.type === 'pin'
          ? rep.id === selectedId
          : c.missions.some((m) => m.id === selectedId)
        const sig = `${priceLabel}|${isSelected}|${urgent}|${count ?? 0}`
        const existing = markersRef.current.get(key)
        if (existing) {
          existing.setLatLng(c.position)
          if (existing.__sig !== sig) {
            const icon = await createMissionPinIcon({ priceLabel, selected: isSelected, urgent, count })
            if (cancelled) return
            existing.setIcon(icon)
            existing.__sig = sig
          }
        } else {
          const icon = await createMissionPinIcon({ priceLabel, selected: isSelected, urgent, count })
          if (cancelled) return
          const marker = L.marker(c.position, { icon, riseOnHover: true })
            .on('click', () => onSelectRef.current(rep.id))
            .addTo(map) as MarkerWithSig
          marker.__sig = sig
          markersRef.current.set(key, marker)
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
  }, [clusters, selectedId, mapRef])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !selectedId) return
    const target = clustersRef.current.find((c) =>
      c.type === 'pin' ? c.mission.id === selectedId : c.missions.some((m) => m.id === selectedId)
    )
    if (!target) return
    map.flyTo(target.position, Math.max(map.getZoom(), 14), { duration: 0.5 })
  }, [selectedId, mapRef])
}
