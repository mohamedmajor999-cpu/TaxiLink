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

  // Le partage à un groupe précis se fait dans la modal de création (sélecteur visibilité).
  // On atterrit donc sur la flow standard ; le pré-remplissage par groupId viendra plus tard.
  const postCourse = () => router.push('/dashboard/chauffeur?creer=1')

  // Stats personnelles du chauffeur courant dans ce groupe — visible uniquement
  // par lui (privé par design : pas de leaderboard public, cf. revue produit).
  // Position calculée sur l'agrégat (sharedCount + acceptedCount).
  const myStats = (() => {
    if (!user?.id || members.length === 0) return null
    const sortedActivity = [...members].sort(
      (a, b) => (b.sharedCount + b.acceptedCount) - (a.sharedCount + a.acceptedCount)
    )
    const myIndex = sortedActivity.findIndex((m) => m.driverId === user.id)
    if (myIndex === -1) return null
    const me = sortedActivity[myIndex]
    const totalMembers = sortedActivity.length
    // Pourcentage = position parmi les actifs (1er = top, dernier = bottom)
    const percentile = Math.round(((myIndex + 1) / totalMembers) * 100)
    return {
      shared: me.sharedCount,
      accepted: me.acceptedCount,
      percentile,
      totalMembers,
    }
  })()

  return {
    group, summary, daily, members, myStats,
    loading, error, leaving, isAdmin,
    leave, back, postCourse,
  }
}
