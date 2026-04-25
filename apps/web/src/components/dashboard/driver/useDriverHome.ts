'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
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

interface UseDriverHomeOptions {
  onShowMissionDetail?: (id: string) => void
}

export function useDriverHome({ onShowMissionDetail }: UseDriverHomeOptions = {}) {
  const driver = useDriverStore((s) => s.driver)
  const setOnline = useDriverStore((s) => s.setOnline)
  const { user } = useAuth()
  const m = useDriverMissions({ onShowMissionDetail })
  const notif = useNextMissionNotification(m.currentMission)

  const [groups, setGroups] = useState<Group[]>([])
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [userAccuracy, setUserAccuracy] = useState<number | null>(null)
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(null)

  const watchIdRef = useRef<number | null>(null)
  const requestLocation = () => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) return
    if (watchIdRef.current != null) return
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const newAcc = pos.coords.accuracy
        setUserAccuracy((prev) => {
          // Rejette les lectures sensiblement moins précises (évite les sauts Wi-Fi ↔ GPS)
          if (prev != null && newAcc > prev * 2 && newAcc > 30) return prev
          setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
          return newAcc
        })
      },
      () => { /* permission refusée : tri « plus proche » retombe sur « plus tôt » */ },
      { enableHighAccuracy: true, timeout: 20_000, maximumAge: 0 },
    )
  }

  useEffect(() => {
    requestLocation()
    return () => {
      if (watchIdRef.current != null && typeof navigator !== 'undefined' && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
    }
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

  const mappableMissions = useMemo(
    () => f.filteredMissions.filter((x) => x.departure_lat != null && x.departure_lng != null),
    [f.filteredMissions],
  )
  const selectedMission = useMemo(
    () => (selectedMissionId ? f.filteredMissions.find((x) => x.id === selectedMissionId) ?? null : null),
    [f.filteredMissions, selectedMissionId],
  )

  useEffect(() => {
    if (!selectedMissionId) return
    if (!f.filteredMissions.some((x) => x.id === selectedMissionId)) setSelectedMissionId(null)
  }, [f.filteredMissions, selectedMissionId])

  const acceptSelected = async () => {
    if (!selectedMissionId) return
    await m.acceptMission(selectedMissionId)
    setSelectedMissionId(null)
  }

  const toggleMission = (id: string) => {
    setSelectedMissionId((prev) => (prev === id ? null : id))
  }

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
    mappableMissions,
    filteredMissions: f.filteredMissions,
    selectedMissionId,
    setSelectedMissionId,
    toggleMission,
    selectedMission,
    acceptSelected,
    urgentOnly: f.urgentOnly,
    setUrgentOnly: f.setUrgentOnly,
    nearbyOnly: f.nearbyOnly,
    setNearbyOnly: f.setNearbyOnly,
    counts: f.counts,
    scopeLabel: f.scopeLabel,
    scopeCount: f.scopeCount,
    filter: f.filter,
    setFilter: f.setFilter,
    sort: f.sort,
    setSort: f.setSort,
    hasUserCoords: userCoords !== null,
    userAccuracy,
    groups,
    selectedGroupId: f.selectedGroupId,
    setSelectedGroupId: f.setSelectedGroupId,
    loading: m.loading,
    error: m.error,
    acceptMission: m.acceptMission,
    completeMission: m.completeMission,
    currentMission: m.currentMission,
    showConfetti: m.showConfetti,
    clearConfetti: m.clearConfetti,
    toasts: m.toasts,
    dismissToast: m.dismissToast,
    userCoords,
    requestLocation,
    notificationPermission: notif.permission,
    requestNotificationPermission: notif.requestPermission,
  }
}
