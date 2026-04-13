import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { groupService } from '@/services/groupService'
import { useGroupActions } from './useGroupActions'
import { useGroupStats } from './useGroupStats'
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
    const supabase = createClient()
    const channel = supabase
      .channel('group-members-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'group_members' }, () => loadGroups())
      .on('postgres_changes', { event: 'DELETE',  schema: 'public', table: 'group_members' }, () => loadGroups())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [driverId, loadGroups])

  const actions = useGroupActions({ driverId, setGroups, loadGroups, setError })
  const stats   = useGroupStats()

  return {
    groups, loading, error,
    ...actions,
    ...stats,
    isAdmin: (group: Group) => group.createdBy === driverId,
  }
}
