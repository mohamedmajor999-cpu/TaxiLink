import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { groupService } from '@/services/groupService'
import type { Group, GroupMemberStats } from '@taxilink/core'

export function useDriverGroupes() {
  const { user } = useAuth()
  const [groups, setGroups]           = useState<Group[]>([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)
  const [showCreate, setShowCreate]   = useState(false)
  const [showJoin, setShowJoin]       = useState(false)
  const [newName, setNewName]         = useState('')
  const [newDesc, setNewDesc]         = useState('')
  const [joinId, setJoinId]           = useState('')
  const [saving, setSaving]           = useState(false)

  // Modal membres
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [memberStats, setMemberStats]     = useState<GroupMemberStats[]>([])
  const [statsLoading, setStatsLoading]   = useState(false)
  const [statsPeriod, setStatsPeriod]     = useState<'week' | 'month'>('month')

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

  // Real-time : recharge la liste quand un membre rejoint ou quitte un groupe
  useEffect(() => {
    if (!driverId) return
    const supabase = createClient()
    const channel = supabase
      .channel('group-members-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'group_members' }, () => loadGroups())
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'group_members' }, () => loadGroups())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [driverId, loadGroups])

  // Recharge les stats quand le groupe sélectionné ou la période change
  useEffect(() => {
    if (!selectedGroup) return
    setStatsLoading(true)
    const since = statsPeriod === 'week'
      ? new Date(Date.now() - 7  * 86_400_000).toISOString()
      : new Date(Date.now() - 30 * 86_400_000).toISOString()

    groupService.getMemberStats(selectedGroup.id, since)
      .then(setMemberStats)
      .catch(() => { /* stats optionnelles — on affiche 0s */ })
      .finally(() => setStatsLoading(false))
  }, [selectedGroup?.id, statsPeriod])

  const openMembers = (group: Group) => {
    setMemberStats([])
    setSelectedGroup(group)
  }

  const handleCreate = async () => {
    if (!driverId || !newName.trim()) return
    setSaving(true)
    try {
      const group = await groupService.create(newName.trim(), newDesc.trim() || null, driverId)
      setGroups((prev) => [group, ...prev])
      setShowCreate(false)
      setNewName('')
      setNewDesc('')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(`Erreur: ${msg}`)
    } finally {
      setSaving(false)
    }
  }

  const handleJoin = async () => {
    if (!driverId || !joinId.trim()) return
    setSaving(true)
    try {
      await groupService.join(joinId.trim(), driverId)
      await loadGroups()
      setShowJoin(false)
      setJoinId('')
    } catch {
      setError('Groupe introuvable ou déjà membre')
    } finally {
      setSaving(false)
    }
  }

  const handleLeave = async (groupId: string) => {
    if (!driverId) return
    try {
      await groupService.leave(groupId, driverId)
      setGroups((prev) => prev.filter((g) => g.id !== groupId))
    } catch {
      setError('Erreur lors de la sortie du groupe')
    }
  }

  const handleDelete = async (groupId: string) => {
    try {
      await groupService.deleteGroup(groupId)
      setGroups((prev) => prev.filter((g) => g.id !== groupId))
    } catch {
      setError('Erreur lors de la suppression du groupe')
    }
  }

  const isAdmin = (group: Group) => group.createdBy === driverId

  return {
    groups, loading, error,
    showCreate, setShowCreate, showJoin, setShowJoin,
    newName, setNewName, newDesc, setNewDesc,
    joinId, setJoinId, saving,
    selectedGroup, memberStats, statsLoading, statsPeriod, setStatsPeriod,
    openMembers, closeMembers: () => setSelectedGroup(null),
    handleCreate, handleJoin, handleLeave, handleDelete, isAdmin,
  }
}
