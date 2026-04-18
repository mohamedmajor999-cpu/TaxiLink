'use client'
import { useEffect, useMemo, useState } from 'react'
import type { Group } from '@taxilink/core'
import { useDriverStore } from '@/store/driverStore'
import { useAuth } from '@/hooks/useAuth'
import { useNextMissionNotification } from '@/hooks/useNextMissionNotification'
import { groupService } from '@/services/groupService'
import { useDriverMissions } from './useDriverMissions'
import type { CourseCardData } from '@/components/taxilink/CourseCard'
import { haversineKm } from '@/lib/geoDistance'
import {
  extractMissionGroupIds,
  isPublicMission,
  toCourseCard,
} from './home/missionVisibility'

export type HomeTypeFilter = 'ALL' | 'CPAM' | 'PRIVE'
export type HomeSort = 'soonest' | 'nearest' | 'highest-pay' | 'newest'

/** Special sentinel value meaning "missions publiques (sans groupe ciblé)" */
export const HOME_GROUP_PUBLIC = '__public__' as const
/** `null` = pas de filtre groupe (toutes les missions) */
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

export function useDriverHome() {
  const driver = useDriverStore((s) => s.driver)
  const setOnline = useDriverStore((s) => s.setOnline)
  const { user } = useAuth()
  const m = useDriverMissions()
  const notif = useNextMissionNotification(m.currentMission)

  const [filter, setFilter] = useState<HomeTypeFilter>('ALL')
  const [sort, setSort] = useState<HomeSort>('soonest')
  const [selectedGroupId, setSelectedGroupId] = useState<HomeGroupSelection>(null)
  const [groups, setGroups] = useState<Group[]>([])
  const [now, setNow] = useState(() => Date.now())
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) return
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => { /* permission refusée : on ignore, tri « plus proche » retombera sur « plus tôt » */ },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 300_000 },
    )
  }, [])

  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    groupService.getMyGroups(user.id)
      .then((gs) => { if (!cancelled) setGroups(gs) })
      .catch(() => { /* silencieux : page fonctionne sans groupes */ })
    return () => { cancelled = true }
  }, [user?.id])

  const groupsById = useMemo(() => {
    const map = new Map<string, Group>()
    for (const g of groups) map.set(g.id, g)
    return map
  }, [groups])

  const filtered = useMemo(() => {
    let list = m.missions.filter((x) => new Date(x.scheduled_at).getTime() > now)
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
  }, [m.missions, filter, selectedGroupId, now, sort, userCoords])

  const cards = useMemo<CourseCardData[]>(
    () => filtered.map((x) => toCourseCard(x, groupsById)),
    [filtered, groupsById],
  )

  const counts = useMemo(() => {
    const live = m.missions.filter((x) => new Date(x.scheduled_at).getTime() > now)
    const c: Record<HomeTypeFilter, number> = { ALL: live.length, CPAM: 0, PRIVE: 0 }
    for (const x of live) {
      if (x.type === 'CPAM') c.CPAM++
      else if (x.type === 'PRIVE') c.PRIVE++
    }
    return c
  }, [m.missions, now])

  const initials =
    (driver.name || '')
      .split(' ')
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'YB'

  return {
    driver,
    setOnline,
    initials,
    city: 'Marseille',
    postalCode: '13008',
    nearbyZone: 'Vieux-Port',
    cards,
    counts,
    filter,
    setFilter,
    sort,
    setSort,
    hasUserCoords: userCoords !== null,
    groups,
    selectedGroupId,
    setSelectedGroupId,
    loading: m.loading,
    error: m.error,
    acceptMission: m.acceptMission,
    currentMission: m.currentMission,
    notificationPermission: notif.permission,
    requestNotificationPermission: notif.requestPermission,
  }
}
