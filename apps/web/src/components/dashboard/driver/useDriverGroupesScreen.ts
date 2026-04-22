import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { groupStatsService, type GroupActivitySummary } from '@/services/groupStatsService'
import type { Group } from '@taxilink/core'
import { useDriverGroupes } from './useDriverGroupes'

export function useDriverGroupesScreen() {
  const groupes = useDriverGroupes()
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [activeSummary, setActiveSummary] = useState<GroupActivitySummary | null>(null)

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return groupes.groups
    return groupes.groups.filter((g) =>
      g.name.toLowerCase().includes(q) ||
      (g.description ?? '').toLowerCase().includes(q)
    )
  }, [groupes.groups, query])

  const activeGroupId = filteredGroups[0]?.id ?? null

  useEffect(() => {
    if (!activeGroupId) { setActiveSummary(null); return }
    let cancelled = false
    groupStatsService.getActivitySummary(activeGroupId)
      .then((s) => { if (!cancelled) setActiveSummary(s) })
      .catch(() => { if (!cancelled) setActiveSummary(null) })
    return () => { cancelled = true }
  }, [activeGroupId])

  const openGroup = (group: Group) => {
    router.push(`/dashboard/chauffeur/groupe/${group.id}`)
  }

  return {
    ...groupes,
    query, setQuery,
    filteredGroups,
    activeGroupId,
    activeSummary,
    openGroup,
  }
}
