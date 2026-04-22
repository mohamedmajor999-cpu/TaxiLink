import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { groupService } from '@/services/groupService'
import {
  groupStatsService,
  type GroupActivitySummary,
  type GroupDailyActivity,
} from '@/services/groupStatsService'
import type { Group, GroupMemberStats } from '@taxilink/core'

export function useGroupDetail(groupId: string) {
  const { user } = useAuth()
  const router = useRouter()
  const [group, setGroup]         = useState<Group | null>(null)
  const [summary, setSummary]     = useState<GroupActivitySummary | null>(null)
  const [daily, setDaily]         = useState<GroupDailyActivity[]>([])
  const [members, setMembers]     = useState<GroupMemberStats[]>([])
  const [loading, setLoading]     = useState(true)
  const [leaving, setLeaving]     = useState(false)
  const [error, setError]         = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user?.id) return
    setLoading(true); setError(null)
    try {
      const myGroups = await groupService.getMyGroups(user.id)
      const found = myGroups.find((g) => g.id === groupId) ?? null
      setGroup(found)
      if (!found) return
      const since = new Date(Date.now() - 7 * 86_400_000).toISOString()
      const [s, d, m] = await Promise.all([
        groupStatsService.getActivitySummary(groupId),
        groupStatsService.getDailyActivity(groupId, 7),
        groupStatsService.getMemberStats(groupId, since),
      ])
      setSummary(s); setDaily(d); setMembers(m)
    } catch {
      setError('Impossible de charger le groupe')
    } finally {
      setLoading(false)
    }
  }, [groupId, user?.id])

  useEffect(() => { load() }, [load])

  const isAdmin = !!group && group.createdBy === user?.id

  const leave = async () => {
    if (!user?.id || !group) return
    setLeaving(true)
    try {
      await groupService.leave(group.id, user.id)
      router.push('/dashboard/chauffeur')
    } catch {
      setError('Impossible de quitter le groupe')
      setLeaving(false)
    }
  }

  const back = () => router.back()

  return {
    group, summary, daily, members,
    loading, error, leaving, isAdmin,
    leave, back,
  }
}
