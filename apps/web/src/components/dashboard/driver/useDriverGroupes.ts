import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { groupService } from '@/services/groupService'
import { useGroupActions } from './useGroupActions'
import type { Group } from '@taxilink/core'

export function useDriverGroupes() {
  const { user } = useAuth()
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState<string | null>(null)

  const driverId = user?.id ?? null

  const loadGroups = useCallback(async () => {
    if (!driverId) return
    try {
      setError(null)
      setGroups(await groupService.getMyGroups(driverId))
    } catch {
      setError('Impossible de charger vos groupes')
    } finally {
      setLoading(false)
    }
  }, [driverId])

  useEffect(() => { loadGroups() }, [loadGroups])

  useEffect(() => {
    if (!driverId) return
    return groupService.subscribeMembers(loadGroups)
  }, [driverId, loadGroups])

  const actions = useGroupActions({ driverId, setGroups, loadGroups, setError })

  return {
    groups, loading, error,
    ...actions,
    isAdmin: (group: Group) => group.createdBy === driverId,
  }
}
