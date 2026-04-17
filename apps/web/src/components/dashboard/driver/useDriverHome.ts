'use client'
import { useEffect, useMemo, useState } from 'react'
import type { Group } from '@taxilink/core'
import { useDriverStore } from '@/store/driverStore'
import { useAuth } from '@/hooks/useAuth'
import { groupService } from '@/services/groupService'
import { useDriverMissions } from './useDriverMissions'
import type { CourseCardData } from '@/components/taxilink/CourseCard'
import {
  extractMissionGroupIds,
  isPublicMission,
  toCourseCard,
} from './home/missionVisibility'

export type HomeTypeFilter = 'ALL' | 'CPAM' | 'PRIVE'

/** Special sentinel value meaning "missions publiques (sans groupe ciblé)" */
export const HOME_GROUP_PUBLIC = '__public__' as const
/** `null` = pas de filtre groupe (toutes les missions) */
export type HomeGroupSelection = string | null

export const HOME_TYPE_FILTERS: { key: HomeTypeFilter; label: string }[] = [
  { key: 'ALL', label: 'Tout' },
  { key: 'CPAM', label: 'Médical' },
  { key: 'PRIVE', label: 'Privé' },
]

export function useDriverHome() {
  const driver = useDriverStore((s) => s.driver)
  const setOnline = useDriverStore((s) => s.setOnline)
  const { user } = useAuth()
  const m = useDriverMissions()

  const [filter, setFilter] = useState<HomeTypeFilter>('ALL')
  const [selectedGroupId, setSelectedGroupId] = useState<HomeGroupSelection>(null)
  const [groups, setGroups] = useState<Group[]>([])

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
    let list = m.missions
    if (filter !== 'ALL') list = list.filter((x) => x.type === filter)
    if (selectedGroupId === HOME_GROUP_PUBLIC) {
      list = list.filter(isPublicMission)
    } else if (selectedGroupId) {
      list = list.filter((x) => extractMissionGroupIds(x).includes(selectedGroupId))
    }
    return list
  }, [m.missions, filter, selectedGroupId])

  const cards = useMemo<CourseCardData[]>(
    () => filtered.map((x) => toCourseCard(x, groupsById)),
    [filtered, groupsById],
  )

  const counts = useMemo(() => {
    const c: Record<HomeTypeFilter, number> = { ALL: m.missions.length, CPAM: 0, PRIVE: 0 }
    for (const x of m.missions) {
      if (x.type === 'CPAM') c.CPAM++
      else if (x.type === 'PRIVE') c.PRIVE++
    }
    return c
  }, [m.missions])

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
    groups,
    selectedGroupId,
    setSelectedGroupId,
    loading: m.loading,
    error: m.error,
    acceptMission: m.acceptMission,
  }
}
