'use client'
import { useEffect, useState } from 'react'
import type { Group } from '@taxilink/core'
import { useDriverStore } from '@/store/driverStore'
import { useAuth } from '@/hooks/useAuth'
import { useNextMissionNotification } from '@/hooks/useNextMissionNotification'
import { groupService } from '@/services/groupService'
import { useDriverMissions } from './useDriverMissions'
import { useDriverHomeFilters } from './home/useDriverHomeFilters'

export {
  HOME_GROUP_PUBLIC,
  HOME_TYPE_FILTERS,
  HOME_SORT_OPTIONS,
  type HomeTypeFilter,
  type HomeSort,
  type HomeGroupSelection,
} from './home/useDriverHomeFilters'

export function useDriverHome() {
  const driver = useDriverStore((s) => s.driver)
  const setOnline = useDriverStore((s) => s.setOnline)
  const { user } = useAuth()
  const m = useDriverMissions()
  const notif = useNextMissionNotification(m.currentMission)

  const [groups, setGroups] = useState<Group[]>([])
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) return
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => { /* permission refusée : tri « plus proche » retombe sur « plus tôt » */ },
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

  const f = useDriverHomeFilters({ missions: m.missions, groups, userCoords })

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
    cards: f.cards,
    counts: f.counts,
    scopeLabel: f.scopeLabel,
    scopeCount: f.scopeCount,
    filter: f.filter,
    setFilter: f.setFilter,
    sort: f.sort,
    setSort: f.setSort,
    hasUserCoords: userCoords !== null,
    groups,
    selectedGroupId: f.selectedGroupId,
    setSelectedGroupId: f.setSelectedGroupId,
    loading: m.loading,
    error: m.error,
    acceptMission: m.acceptMission,
    completeMission: m.completeMission,
    currentMission: m.currentMission,
    userCoords,
    notificationPermission: notif.permission,
    requestNotificationPermission: notif.requestPermission,
  }
}
