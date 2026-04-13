import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { groupService } from '@/services/groupService'
import type { Group, GroupMember } from '@taxilink/core'

export function useDriverGroupes() {
  const { user } = useAuth()
  const [groups, setGroups]           = useState<Group[]>([])
  const [members, setMembers]         = useState<GroupMember[]>([])
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [loading, setLoading]         = useState(true)
  const [membersLoading, setMembersLoading] = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [showCreate, setShowCreate]   = useState(false)
  const [showJoin, setShowJoin]       = useState(false)
  const [newName, setNewName]         = useState('')
  const [newDesc, setNewDesc]         = useState('')
  const [joinId, setJoinId]           = useState('')
  const [saving, setSaving]           = useState(false)

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

  const openMembers = async (group: Group) => {
    setSelectedGroup(group)
    setMembersLoading(true)
    try {
      setMembers(await groupService.getMembers(group.id))
    } catch {
      setError('Impossible de charger les membres')
    } finally {
      setMembersLoading(false)
    }
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
      console.error('[handleCreate]', msg)
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
      setError("Groupe introuvable ou déjà membre")
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
    groups, members, selectedGroup, loading, membersLoading, error,
    showCreate, setShowCreate, showJoin, setShowJoin,
    newName, setNewName, newDesc, setNewDesc,
    joinId, setJoinId, saving,
    openMembers, closeMembers: () => setSelectedGroup(null),
    handleCreate, handleJoin, handleLeave, handleDelete, isAdmin,
  }
}
