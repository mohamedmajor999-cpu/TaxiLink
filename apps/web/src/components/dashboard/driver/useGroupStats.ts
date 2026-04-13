import { useState, useEffect } from 'react'
import { groupStatsService } from '@/services/groupStatsService'
import type { Group, GroupMemberStats } from '@taxilink/core'

export function useGroupStats() {
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [memberStats, setMemberStats]     = useState<GroupMemberStats[]>([])
  const [statsLoading, setStatsLoading]   = useState(false)
  const [statsPeriod, setStatsPeriod]     = useState<'week' | 'month'>('month')

  useEffect(() => {
    if (!selectedGroup) return
    setStatsLoading(true)
    const since = statsPeriod === 'week'
      ? new Date(Date.now() - 7  * 86_400_000).toISOString()
      : new Date(Date.now() - 30 * 86_400_000).toISOString()

    groupStatsService.getMemberStats(selectedGroup.id, since)
      .then(setMemberStats)
      .catch(() => { /* stats optionnelles */ })
      .finally(() => setStatsLoading(false))
  }, [selectedGroup?.id, statsPeriod])

  return {
    selectedGroup,
    memberStats,
    statsLoading,
    statsPeriod, setStatsPeriod,
    openMembers:  (group: Group) => { setMemberStats([]); setSelectedGroup(group) },
    closeMembers: () => setSelectedGroup(null),
  }
}
