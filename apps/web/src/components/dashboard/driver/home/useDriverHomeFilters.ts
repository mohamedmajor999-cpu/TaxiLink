'use client'
import { useEffect, useMemo, useState } from 'react'
import type { Group } from '@taxilink/core'
import type { Mission } from '@/lib/supabase/types'
import type { CourseCardData } from '@/components/taxilink/CourseCard'
import { haversineKm } from '@/lib/geoDistance'
import { extractMissionGroupIds, isPublicMission, toCourseCard } from './missionVisibility'

export type HomeTypeFilter = 'ALL' | 'CPAM' | 'PRIVE'
export type HomeSort = 'soonest' | 'nearest' | 'highest-pay' | 'newest'

export const HOME_GROUP_PUBLIC = '__public__' as const
export type HomeGroupSelection = string | null

export const HOME_TYPE_FILTERS: { key: HomeTypeFilter; label: string }[] = [
  { key: 'ALL', label: 'Tout' },
  { key: 'CPAM', label: 'Médical' },
  { key: 'PRIVE', label: 'Privé' },
]

export const HOME_SORT_OPTIONS: { key: HomeSort; label: string }[] = [
  { key: 'soonest', label: 'Plus tôt' },
  { key: 'nearest', label: 'Plus proche' },
  { key: 'highest-pay', label: 'Mieux payée' },
  { key: 'newest', label: 'Plus récente' },
]

const FAR_AWAY = Number.POSITIVE_INFINITY

interface Params {
  missions: Mission[]
  groups: Group[]
  userCoords: { lat: number; lng: number } | null
}

export function useDriverHomeFilters({ missions, groups, userCoords }: Params) {
  const [filter, setFilter] = useState<HomeTypeFilter>('ALL')
  const [sort, setSort] = useState<HomeSort>('soonest')
  const [selectedGroupId, setSelectedGroupId] = useState<HomeGroupSelection>(null)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(id)
  }, [])

  const groupsById = useMemo(() => {
    const map = new Map<string, Group>()
    for (const g of groups) map.set(g.id, g)
    return map
  }, [groups])

  const filtered = useMemo(() => {
    let list = missions.filter((x) => new Date(x.scheduled_at).getTime() > now)
    if (filter !== 'ALL') list = list.filter((x) => x.type === filter)
    if (selectedGroupId === HOME_GROUP_PUBLIC) {
      list = list.filter(isPublicMission)
    } else if (selectedGroupId) {
      list = list.filter((x) => extractMissionGroupIds(x).includes(selectedGroupId))
    }
    const sorted = [...list]
    sorted.sort((a, b) => {
      if (sort === 'highest-pay') return (b.price_eur ?? 0) - (a.price_eur ?? 0)
      if (sort === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      if (sort === 'nearest' && userCoords) {
        const da = a.departure_lat != null && a.departure_lng != null
          ? haversineKm(userCoords, { lat: a.departure_lat, lng: a.departure_lng })
          : FAR_AWAY
        const db = b.departure_lat != null && b.departure_lng != null
          ? haversineKm(userCoords, { lat: b.departure_lat, lng: b.departure_lng })
          : FAR_AWAY
        return da - db
      }
      return new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
    })
    return sorted
  }, [missions, filter, selectedGroupId, now, sort, userCoords])

  const cards = useMemo<CourseCardData[]>(
    () => filtered.map((x) => toCourseCard(x, groupsById)),
    [filtered, groupsById],
  )

  const counts = useMemo(() => {
    const live = missions.filter((x) => new Date(x.scheduled_at).getTime() > now)
    const c: Record<HomeTypeFilter, number> = { ALL: live.length, CPAM: 0, PRIVE: 0 }
    for (const x of live) {
      if (x.type === 'CPAM') c.CPAM++
      else if (x.type === 'PRIVE') c.PRIVE++
    }
    return c
  }, [missions, now])

  const scopeLabel = useMemo(() => {
    if (!selectedGroupId) return 'tous mes groupes'
    if (selectedGroupId === HOME_GROUP_PUBLIC) return 'missions publiques'
    return groupsById.get(selectedGroupId)?.name ?? ''
  }, [selectedGroupId, groupsById])

  const scopeCount = useMemo(() => {
    let list = missions.filter((x) => new Date(x.scheduled_at).getTime() > now)
    if (selectedGroupId === HOME_GROUP_PUBLIC) {
      list = list.filter(isPublicMission)
    } else if (selectedGroupId) {
      list = list.filter((x) => extractMissionGroupIds(x).includes(selectedGroupId))
    }
    return list.length
  }, [missions, selectedGroupId, now])

  return {
    filter,
    setFilter,
    sort,
    setSort,
    selectedGroupId,
    setSelectedGroupId,
    cards,
    counts,
    scopeLabel,
    scopeCount,
  }
}
